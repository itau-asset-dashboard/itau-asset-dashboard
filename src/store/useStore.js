import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetchPosts, upsertPost, removePost, fetchSetting, saveSetting, uploadImage, deleteImage,
         fetchStories, upsertStory, removeStory, uploadStoryImage, deleteStoryImage } from '../lib/supabase'
import { normalizeTema } from '../utils/temas'

function normalizeDate(d) {
  if (!d) return d
  const parts = d.replace(/-/g, '/').split('/')
  if (parts.length !== 3) return d
  if (parts[0].length === 4) return `${parts[2].padStart(2,'0')}/${parts[1].padStart(2,'0')}/${parts[0]}`
  return `${parts[0].padStart(2,'0')}/${parts[1].padStart(2,'0')}/${parts[2]}`
}

export const useStore = create(
  persist(
    (set, get) => ({
      posts: [],
      stories: [],
      metaMensal: 200000,
      metaAnual: 1090000,
      mesFiltro: '01/2026',
      oliverData: {}, // { 'MM/YYYY': { alcance_oliver: number, meta_oliver: number } }
      activeSection: 'visao-anual',
      insights: [],
      loadingInsights: false,
      syncing: false,
      syncError: null,
      apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
      isEditMode: false,

      // ── Sync inicial com Supabase ──────────────────────
      syncFromCloud: async () => {
        set({ syncing: true, syncError: null })
        try {
          const [cloudPosts, metaMensal, metaAnual, oliverRaw, evidenciasRaw, cloudStoriesRaw] = await Promise.all([
            fetchPosts(),
            fetchSetting('meta_mensal'),
            fetchSetting('meta_anual'),
            fetchSetting('oliver_data'),
            fetchSetting('data_evidencias'),
            fetchStories().catch(() => null), // null = falha, [] = Supabase vazio de verdade
          ])
          // Preserva imageData local — nunca é salvo no Supabase (muito pesado)
          // Também normaliza o campo `tema` para array limpo
          const localPosts = get().posts
          const cloudIds = new Set(cloudPosts.map(p => p.id))

          // Posts que existem só no localStorage (nunca chegaram ao Supabase) → reenviar
          const orphans = localPosts.filter(lp => !cloudIds.has(lp.id))

          const dirty = []
          // Migração única: lê o mapa antigo de evidências do settings para preencher
          // posts que ainda têm a coluna vazia no Supabase
          let legacyEvidencias = {}
          if (evidenciasRaw) {
            try { legacyEvidencias = JSON.parse(evidenciasRaw) } catch (_) {}
          }

          const posts = cloudPosts.map(cp => {
            // Coluna data_evidencia agora vem direto do Supabase (fonte da verdade)
            // Fallback para o mapa legado (migração) ou valor local se coluna ainda vazia
            const local = localPosts.find(lp => lp.id === cp.id)
            const evidencia = cp.data_evidencia
              || legacyEvidencias[cp.id]
              || local?.data_evidencia
              || ''
            const merged = { ...cp, data_evidencia: evidencia }
            const temaNorm = normalizeTema(merged.tema)
            const dateNorm = normalizeDate(merged.data_post)
            const wasDirty = JSON.stringify(merged.tema) !== JSON.stringify(temaNorm)
                          || dateNorm !== merged.data_post
                          || (evidencia && !cp.data_evidencia) // migra legado para coluna
            if (wasDirty) dirty.push({ ...merged, tema: temaNorm, data_post: dateNorm })
            return { ...merged, tema: temaNorm, data_post: dateNorm }
          })

          // Inclui os órfãos normalizados no estado
          const orphansNorm = orphans.map(p => ({
            ...p,
            tema:      normalizeTema(p.tema),
            data_post: normalizeDate(p.data_post),
          }))

          // Merge oliverData: cloud tem prioridade, mas mantém entradas locais não presentes na nuvem
          let newOliver = get().oliverData
          if (oliverRaw) {
            try {
              const fromCloud = JSON.parse(oliverRaw)
              newOliver = { ...newOliver, ...fromCloud }
            } catch (_) {}
          }

          // Merge stories: Supabase é fonte da verdade quando retorna dados
          const localStories = get().stories
          console.log('[sync] cloudStoriesRaw:', cloudStoriesRaw?.length ?? 'null', '| localStories:', localStories.length)
          let mergedStories = localStories // fallback: mantém local

          if (cloudStoriesRaw !== null) {
            const cloudStories = cloudStoriesRaw
            if (cloudStories.length > 0) {
              // Supabase tem dados: usa como fonte da verdade
              mergedStories = cloudStories
            } else {
              // Supabase retornou vazio: pode ser que os saves ainda não chegaram
              // Re-envia stories locais para garantir sincronização
              if (localStories.length > 0) {
                mergedStories = localStories
                localStories.forEach(st => {
                  try { upsertStory(st) } catch (_) {}
                })
              }
            }
          }

          set({
            posts: [...posts, ...orphansNorm],
            stories: mergedStories,
            metaMensal: metaMensal ? Number(metaMensal) : get().metaMensal,
            metaAnual:  metaAnual  ? Number(metaAnual)  : get().metaAnual,
            oliverData: newOliver,
            syncing: false,
          })

          // Reenviar órfãos + posts com dados sujos para o Supabase
          const toSave = [...orphansNorm, ...dirty]
          if (toSave.length > 0) {
            toSave.forEach(p => { try { upsertPost(p) } catch (_) {} })
          }

          // Sempre garante que oliverData local está no Supabase
          if (Object.keys(newOliver).length > 0) {
            try { saveSetting('oliver_data', JSON.stringify(newOliver)) } catch (_) {}
          }
        } catch (e) {
          set({ syncing: false, syncError: e.message })
        }
      },

      // ── Setters simples ────────────────────────────────
      setApiKey:          (key) => set({ apiKey: key }),
      setActiveSection:   (s)   => set({ activeSection: s }),
      setEditMode: (v) => set({ isEditMode: v }),
      setInsights:        (ins) => set({ insights: ins }),
      setLoadingInsights: (v)   => set({ loadingInsights: v }),

      setMetaMensal: async (meta) => {
        set({ metaMensal: meta })
        try { await saveSetting('meta_mensal', meta) } catch (_) {}
      },

      setMetaAnual: async (meta) => {
        set({ metaAnual: meta })
        try { await saveSetting('meta_anual', meta) } catch (_) {}
      },

      setMesFiltro: (mes) => set({ mesFiltro: mes }),

      setOliverData: (mes, valores) => {
        const updated = {
          ...get().oliverData,
          [mes]: { ...(get().oliverData[mes] || {}), ...valores },
        }
        set({ oliverData: updated })
        // Persiste no Supabase para sincronizar entre dispositivos
        try { saveSetting('oliver_data', JSON.stringify(updated)) } catch (_) {}
      },

      // ── Posts ──────────────────────────────────────────
      addPost: async (post) => {
        const id = Date.now().toString()
        const { imagePreview, ...rest } = post
        const novo = { nome: '', interacoes: null, ...rest, id, historico: [], atualizado_em: null }
        novo.tema = normalizeTema(novo.tema)

        // Usa imagePreview (original) para Storage; fallback para imageData comprimido
        const srcForUpload = imagePreview || novo.imageData
        if (srcForUpload?.startsWith('data:')) {
          try {
            const imageUrl = await uploadImage(id, srcForUpload)
            if (imageUrl) novo.imageUrl = imageUrl
          } catch (_) {}
        }

        set((s) => ({ posts: [...s.posts, novo] }))
        try { await upsertPost({ ...novo, imageUrl: novo.imageUrl || null }) } catch (_) {}
      },

      updatePost: async (id, newData) => {
        const { imagePreview, ...restData } = newData
        // Usa imagePreview (original) para Storage; fallback para imageData comprimido
        let imageUrl = restData.imageUrl
        const srcForUpload = imagePreview || restData.imageData
        if (srcForUpload?.startsWith('data:')) {
          try {
            imageUrl = await uploadImage(id, srcForUpload)
          } catch (_) {}
        }

        set((state) => {
          const posts = state.posts.map((p) => {
            if (p.id !== id) return p
            const historico = [...(p.historico || []), {
              data: new Date().toLocaleDateString('pt-BR'),
              dados: {
                contas_alcancadas: p.contas_alcancadas,
                visualizacoes: p.visualizacoes,
                interacoes: p.interacoes,
                curtidas: p.curtidas,
                comentarios: p.comentarios,
                salvamentos: p.salvamentos,
                compartilhamentos: p.compartilhamentos,
                status: p.status,
              },
            }]
            const tema = normalizeTema(restData.tema ?? p.tema)
            return { ...p, ...restData, tema, imageUrl: imageUrl || p.imageUrl, historico, atualizado_em: new Date().toLocaleDateString('pt-BR') }
          })
          return { posts }
        })
        const updated = get().posts.find((p) => p.id === id)
        if (updated) {
          try {
            await upsertPost(updated)
          } catch (e) {
            console.error('[updatePost] upsert falhou:', e)
            set({ syncError: 'Erro ao salvar post: ' + (e?.message || JSON.stringify(e)) })
          }
        }
      },

      deletePost: async (id) => {
        set((s) => ({ posts: s.posts.filter((p) => p.id !== id) }))
        try { await removePost(id) } catch (_) {}
        try { await deleteImage(id) } catch (_) {}
      },

      // Remove todos os posts com ano anterior a 2026
      deletePostsAntigos: async () => {
        const { posts } = get()
        const antigos = posts.filter(p => {
          const ano = p.data_post?.split('/')?.[2]
          return ano && parseInt(ano, 10) < 2026
        })
        // Remove do estado local imediatamente
        set(s => ({ posts: s.posts.filter(p => {
          const ano = p.data_post?.split('/')?.[2]
          return !ano || parseInt(ano, 10) >= 2026
        })}))
        // Remove do Supabase em paralelo
        await Promise.allSettled(
          antigos.map(p => removePost(p.id).catch(() => {}))
        )
        return antigos.length
      },

      // ── Stories ────────────────────────────────────────
      addStory: async (story) => {
        const id = Date.now().toString()
        const { imagePreview, ...rest } = story
        const novo = { ...rest, id }
        const src = imagePreview || novo.imageData
        if (src?.startsWith('data:')) {
          try {
            const url = await uploadStoryImage(id, src)
            if (url) novo.imageUrl = url
          } catch (e) { console.error('[story image upload]', e) }
        }
        set(s => ({ stories: [...s.stories, novo] }))
        try {
          await upsertStory({ ...novo, imageUrl: novo.imageUrl || null })
        } catch (e) {
          console.error('[upsertStory]', e)
          set({ syncError: 'Erro ao salvar story: ' + (e.message || 'verifique o console') })
        }
      },

      updateStory: async (id, newData) => {
        const { imagePreview, ...restData } = newData
        let imageUrl = restData.imageUrl
        const src = imagePreview || restData.imageData
        if (src?.startsWith('data:')) {
          try { imageUrl = await uploadStoryImage(id, src) } catch (e) { console.error('[story image upload]', e) }
        }
        set(s => ({
          stories: s.stories.map(st =>
            st.id !== id ? st : { ...st, ...restData, imageUrl: imageUrl || st.imageUrl }
          )
        }))
        const updated = get().stories.find(s => s.id === id)
        if (updated) {
          try {
            await upsertStory(updated)
          } catch (e) {
            console.error('[upsertStory update]', e)
            set({ syncError: 'Erro ao atualizar story: ' + (e.message || 'verifique o console') })
          }
        }
      },

      deleteStory: async (id) => {
        set(s => ({ stories: s.stories.filter(st => st.id !== id) }))
        try { await removeStory(id) } catch (_) {}
        try { await deleteStoryImage(id) } catch (_) {}
      },

      // ── Query ──────────────────────────────────────────
      getPostsDoMes: () => {
        const { posts, mesFiltro } = get()
        if (!mesFiltro) return posts
        return posts.filter((p) => {
          const parts = p.data_post?.split('/')
          if (!parts || parts.length < 3) return false
          return `${parts[1]}/${parts[2]}` === mesFiltro
        })
      },

      // Meta mensal ajustada:
      // - Meses PASSADOS (antes do mês real de hoje): meta base = metaAnual ÷ 12 (congelada)
      // - Mês ATUAL e FUTUROS: (metaAnual − total alcançado nos meses já fechados) ÷ meses restantes
      getMetaMesAjustada: (mesFiltroParam) => {
        const { posts, metaAnual, mesFiltro } = get()
        const filtro = mesFiltroParam || mesFiltro
        if (!filtro) return Math.round(metaAnual / 12)

        const [mmStr, yyyy] = filtro.split('/')
        const mesVisto = parseInt(mmStr, 10)

        // Mês real de hoje para separar passado de presente/futuro
        const hoje    = new Date()
        const mesHoje = hoje.getMonth() + 1
        const anoHoje = String(hoje.getFullYear())

        // Meses passados → meta base fixa
        if (yyyy < anoHoje || (yyyy === anoHoje && mesVisto < mesHoje)) {
          return Math.round(metaAnual / 12)
        }

        // Mês atual ou futuro → ajusta com base nos meses já fechados (< mesHoje)
        const mesCorte = yyyy === anoHoje ? mesHoje : 1
        const totalFechado = posts.reduce((s, p) => {
          const pts = p.data_post?.split('/')
          if (!pts || pts[2] !== yyyy) return s
          const mes = parseInt(pts[1], 10)
          if (mes < mesCorte) return s + (p.contas_alcancadas || 0)
          return s
        }, 0)

        const mesesRestantes = 12 - mesCorte + 1
        if (mesesRestantes <= 0) return 0

        const saldo = Math.max(metaAnual - totalFechado, 0)
        return Math.round(saldo / mesesRestantes)
      },

      // Força o reenvio de TODOS os posts locais para o Supabase
      recoverLocalPosts: async () => {
        const { posts } = get()
        if (!posts.length) return 0
        let saved = 0
        for (const p of posts) {
          try {
            await upsertPost({
              ...p,
              tema: normalizeTema(p.tema),
              data_post: normalizeDate(p.data_post),
            })
            saved++
          } catch (_) {}
        }
        return saved
      },

      getPostsDoAno: (ano) => {
        const { posts, mesFiltro } = get()
        const anoAlvo = ano || mesFiltro?.split('/')?.[1] || new Date().getFullYear().toString()
        return posts.filter((p) => {
          const parts = p.data_post?.split('/')
          return parts?.[2] === anoAlvo
        })
      },
    }),
    {
      name: 'itau-asset-instagram',
      partialize: (s) => ({
        // imageData (base64) NÃO é persistido — ocupa muito espaço e as imagens
        // já estão no Supabase Storage via imageUrl.
        // stories e insights NÃO são persistidos: stories vêm do Supabase no sync,
        // insights são gerados sob demanda — não precisam ocupar espaço no localStorage.
        posts:          s.posts.map(({ imageData, ...p }) => p),
        metaMensal:     s.metaMensal,
        metaAnual:      s.metaAnual,
        mesFiltro:      s.mesFiltro,
        apiKey:         s.apiKey,
        oliverData:     s.oliverData,
        isEditMode:     s.isEditMode,
        activeSection:  s.activeSection,
      }),
    }
  )
)
