import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetchPosts, upsertPost, removePost, fetchSetting, saveSetting, uploadImage, deleteImage } from '../lib/supabase'
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

      // ── Sync inicial com Supabase ──────────────────────
      syncFromCloud: async () => {
        set({ syncing: true, syncError: null })
        try {
          const [cloudPosts, metaMensal, metaAnual] = await Promise.all([
            fetchPosts(),
            fetchSetting('meta_mensal'),
            fetchSetting('meta_anual'),
          ])
          // Preserva imageData local — nunca é salvo no Supabase (muito pesado)
          // Também normaliza o campo `tema` para array limpo
          const localPosts = get().posts
          const cloudIds = new Set(cloudPosts.map(p => p.id))

          // Posts que existem só no localStorage (nunca chegaram ao Supabase) → reenviar
          const orphans = localPosts.filter(lp => !cloudIds.has(lp.id))

          const dirty = []
          const posts = cloudPosts.map(cp => {
            const local = localPosts.find(lp => lp.id === cp.id)
            // Preserva campos que existem só no localStorage (não estão no Supabase)
            const merged   = {
              ...cp,
              ...(local?.imageData     && { imageData:     local.imageData }),
              ...(local?.data_evidencia && { data_evidencia: local.data_evidencia }),
            }
            const temaNorm = normalizeTema(merged.tema)
            const dateNorm = normalizeDate(merged.data_post)
            const wasDirty = JSON.stringify(merged.tema) !== JSON.stringify(temaNorm)
                          || dateNorm !== merged.data_post
            if (wasDirty) dirty.push({ ...merged, tema: temaNorm, data_post: dateNorm })
            return { ...merged, tema: temaNorm, data_post: dateNorm }
          })

          // Inclui os órfãos normalizados no estado
          const orphansNorm = orphans.map(p => ({
            ...p,
            tema:      normalizeTema(p.tema),
            data_post: normalizeDate(p.data_post),
          }))

          set({
            posts: [...posts, ...orphansNorm],
            metaMensal: metaMensal ? Number(metaMensal) : get().metaMensal,
            metaAnual:  metaAnual  ? Number(metaAnual)  : get().metaAnual,
            syncing: false,
          })

          // Reenviar órfãos + posts com dados sujos para o Supabase
          const toSave = [...orphansNorm, ...dirty]
          if (toSave.length > 0) {
            toSave.forEach(p => { try { upsertPost(p) } catch (_) {} })
          }
        } catch (e) {
          set({ syncing: false, syncError: e.message })
        }
      },

      // ── Setters simples ────────────────────────────────
      setApiKey:          (key) => set({ apiKey: key }),
      setActiveSection:   (s)   => set({ activeSection: s }),
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

      setOliverData: (mes, valores) => set(s => ({
        oliverData: { ...s.oliverData, [mes]: { ...s.oliverData[mes], ...valores } }
      })),

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
        if (updated) try { await upsertPost(updated) } catch (_) {}
      },

      deletePost: async (id) => {
        set((s) => ({ posts: s.posts.filter((p) => p.id !== id) }))
        try { await removePost(id) } catch (_) {}
        try { await deleteImage(id) } catch (_) {}
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
        posts:       s.posts,
        metaMensal:  s.metaMensal,
        metaAnual:   s.metaAnual,
        mesFiltro:   s.mesFiltro,
        insights:    s.insights,
        apiKey:      s.apiKey,
        oliverData:  s.oliverData,
      }),
    }
  )
)
