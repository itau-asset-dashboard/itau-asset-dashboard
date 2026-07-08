import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetchPosts, upsertPost, removePost, fetchSetting, saveSetting, uploadImage, deleteImage,
         fetchStories, upsertStory, removeStory, uploadStoryImage, deleteStoryImage,
         fetchLinkedinPosts, upsertLinkedinPost, removeLinkedinPost, batchInsertLinkedinPosts } from '../lib/supabase'
import { normalizeTema } from '../utils/temas'

// Posts com save em andamento — protege contra sync sobrescrever antes do upsert terminar
const pendingUpdates = new Map() // id → { imageUrl }

// LinkedIn posts com save em andamento
const pendingLinkedinUpdates = new Map() // id → partial post data

// Cache para getPostsDoMes — evita re-filtrar o array inteiro em cada render
let _postsDoMesCache = { posts: null, mesFiltro: null, result: null }

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
      linkedinPosts: [],
      linkedinPageData: {}, // { 'MM/YYYY': { impressoes, usuarios_alcancados, ... } }
      linkedinSeguidores: null,
      navarroLinks: [], // [{ id, nome, url, acessos }]
      linkedinAction: null, // 'upload' | 'import' | null — trigger modal from TopBar
      linkedinAnoFiltro: String(new Date().getFullYear()),
      linkedinMesBiblioteca: `${String(new Date().getMonth()+1).padStart(2,'0')}/${new Date().getFullYear()}`,
      metaMensal: 200000,
      metaAnual: 743000,
      mesFiltro: '01/2026',
      oliverData: {}, // { 'MM/YYYY': { alcance_oliver: number, meta_oliver: number } }
      activeSection: (() => {
        const VALID = ['visao-geral','visao-anual','insights','oliver','posts','etfs','glossario','stories','upload','navarro']
        const hash = typeof window !== 'undefined' ? window.location.hash.replace('#','') : ''
        return VALID.includes(hash) ? hash : 'visao-anual'
      })(),
      insights: [],
      loadingInsights: false,
      syncing: false,
      hasSynced: false,
      syncError: null,
      apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
      isEditMode: false,

      // ── Sync inicial com Supabase ──────────────────────
      syncFromCloud: async () => {
        set({ syncing: true, syncError: null })
        try {
          const [cloudPosts, metaMensal, metaAnual, oliverRaw, evidenciasRaw, cloudStoriesRaw, insightsRaw, cloudLinkedin, linkedinPageRaw, linkedinSegRaw, navarroRaw] = await Promise.all([
            fetchPosts(),
            fetchSetting('meta_mensal'),
            fetchSetting('meta_anual'),
            fetchSetting('oliver_data'),
            fetchSetting('data_evidencias'),
            fetchStories().catch(() => null),
            fetchSetting('insights').catch(() => null),
            fetchLinkedinPosts().catch(() => []),
            fetchSetting('linkedin_page_data').catch(() => null),
            fetchSetting('linkedin_seguidores').catch(() => null),
            fetchSetting('navarro_links').catch(() => null),
          ])
          const localPosts = get().posts

          const dirty = []
          // Migração única: lê o mapa antigo de evidências do settings para preencher
          // posts que ainda têm a coluna vazia no Supabase
          let legacyEvidencias = {}
          if (evidenciasRaw) {
            try { legacyEvidencias = JSON.parse(evidenciasRaw) } catch (_) {}
          }

          // Recupera URLs de imagem que ficaram pendentes (página morreu no mobile)
          const recoveredImages = {}
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key?.startsWith('pending_image_')) {
              const postId = key.replace('pending_image_', '')
              recoveredImages[postId] = localStorage.getItem(key)
            }
          }

          const posts = cloudPosts.map(cp => {
            const local = localPosts.find(lp => lp.id === cp.id)
            const evidencia = cp.data_evidencia
              || legacyEvidencias[cp.id]
              || local?.data_evidencia
              || ''
            // Prioridade: save em andamento > URL recuperada do localStorage > cloud
            const pending = pendingUpdates.get(cp.id)
            const recovered = recoveredImages[cp.id]
            const imageUrl = pending?.imageUrl ?? recovered ?? cp.imageUrl ?? local?.imageUrl ?? null
            const merged = { ...cp, data_evidencia: evidencia, imageUrl }
            const temaNorm = normalizeTema(merged.tema)
            const dateNorm = normalizeDate(merged.data_post)
            const wasDirty = JSON.stringify(merged.tema) !== JSON.stringify(temaNorm)
                          || dateNorm !== merged.data_post
                          || (evidencia && !cp.data_evidencia) // migra legado para coluna
            if (wasDirty) dirty.push({ ...merged, tema: temaNorm, data_post: dateNorm })
            return { ...merged, tema: temaNorm, data_post: dateNorm }
          })

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

          let savedInsights = get().insights
          if (insightsRaw) {
            try {
              const parsed = JSON.parse(insightsRaw)
              if (Array.isArray(parsed) && parsed.length > 0) savedInsights = parsed
            } catch (_) {}
          }

          // Normaliza temas do LinkedIn (podem vir como string JSON do Supabase)
          // Protege posts com save em andamento: mantém dados locais se upsert ainda não chegou ao servidor
          const localLinkedin = get().linkedinPosts
          const linkedinNorm = (cloudLinkedin || []).map(p => {
            let tema = p.tema
            if (typeof tema === 'string') { try { tema = JSON.parse(tema) } catch (_) { tema = tema ? [tema] : [] } }
            if (!Array.isArray(tema)) tema = []
            const norm = { ...p, tema }
            const pending = pendingLinkedinUpdates.get(p.id)
            if (pending) return { ...norm, ...pending }
            return norm
          })
          // Mantém posts locais que ainda não foram confirmados pelo servidor
          const localOnly = localLinkedin.filter(lp => !linkedinNorm.find(cp => cp.id === lp.id) && pendingLinkedinUpdates.has(lp.id))

          let linkedinPageData = get().linkedinPageData
          if (linkedinPageRaw) { try { linkedinPageData = { ...linkedinPageData, ...JSON.parse(linkedinPageRaw) } } catch (_) {} }
          const linkedinSeguidores = linkedinSegRaw != null ? Number(linkedinSegRaw) : get().linkedinSeguidores

          set({
            posts,
            stories: mergedStories,
            insights: savedInsights,
            linkedinPosts: linkedinNorm.length > 0 ? [...linkedinNorm, ...localOnly] : get().linkedinPosts,
            linkedinPageData,
            linkedinSeguidores,
            navarroLinks: navarroRaw ? (() => { try { return JSON.parse(navarroRaw) } catch (_) { return get().navarroLinks } })() : get().navarroLinks,
            metaMensal: metaMensal ? Number(metaMensal) : get().metaMensal,
            metaAnual:  metaAnual  ? Number(metaAnual)  : get().metaAnual,
            oliverData: newOliver,
            syncing: false,
            hasSynced: true,
          })

          // Reenviar posts com dados sujos (normalização de tema/data) para o Supabase
          if (dirty.length > 0) {
            dirty.forEach(p => { try { upsertPost(p) } catch (_) {} })
          }

          // Reenviar imagens que ficaram pendentes (mobile matou a página antes do upsert)
          const recoveredIds = Object.keys(recoveredImages)
          if (recoveredIds.length > 0) {
            recoveredIds.forEach(async pid => {
              const post = posts.find(p => p.id === pid)
              if (post) {
                try {
                  await upsertPost(post)
                  localStorage.removeItem('pending_image_' + pid)
                } catch (_) {}
              }
            })
          }

          // Sempre garante que oliverData local está no Supabase
          if (Object.keys(newOliver).length > 0) {
            try { saveSetting('oliver_data', JSON.stringify(newOliver)) } catch (_) {}
          }
        } catch (e) {
          set({ syncing: false, hasSynced: true, syncError: e.message })
        }
      },

      // ── Setters simples ────────────────────────────────
      setApiKey:          (key) => set({ apiKey: key }),
      setActiveSection:   (s)   => set({ activeSection: s }),
      setEditMode: (v) => set({ isEditMode: v }),
      setInsights: (ins) => {
        set({ insights: ins })
        try { saveSetting('insights', JSON.stringify(ins)) } catch (_) {}
      },
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
      setLinkedinAction: (action) => set({ linkedinAction: action }),
      setLinkedinAnoFiltro: (ano) => set({ linkedinAnoFiltro: ano }),
      setLinkedinMesBiblioteca: (mes) => set({ linkedinMesBiblioteca: mes }),

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
        let imageUrl = restData.imageUrl
        const srcForUpload = imagePreview || restData.imageData
        const isNewImage = srcForUpload?.startsWith('data:')
        if (isNewImage) {
          pendingUpdates.set(id, { imageUrl })
          try {
            const uploaded = await uploadImage(id, srcForUpload)
            imageUrl = uploaded ? `${uploaded.split('?')[0]}?v=${Date.now()}` : imageUrl
            pendingUpdates.set(id, { imageUrl })
            // Write-ahead log: persiste URL no localStorage imediatamente após upload.
            // Se a página morrer antes do upsertPost, o sync vai recuperar no próximo load.
            try { localStorage.setItem('pending_image_' + id, imageUrl) } catch (_) {}
          } catch (e) {
            console.error('[updatePost] upload de imagem falhou:', e)
            set({ syncError: 'Erro ao fazer upload da imagem: ' + (e?.message || String(e)) })
            pendingUpdates.delete(id)
          }
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
            // Upsert confirmado — limpa write-ahead log
            try { localStorage.removeItem('pending_image_' + id) } catch (_) {}
          } catch (e) {
            console.error('[updatePost] upsert falhou:', e)
            set({ syncError: 'Erro ao salvar post: ' + (e?.message || JSON.stringify(e)) })
          } finally {
            pendingUpdates.delete(id)
          }
        }
      },

      deletePost: async (id) => {
        set((s) => ({ posts: s.posts.filter((p) => p.id !== id) }))
        try { await removePost(id) } catch (_) {}
        try { await deleteImage(id) } catch (_) {}
      },

      // Remove posts anteriores a 2025 (mantém histórico 2025+)
      deletePostsAntigos: async () => {
        const { posts } = get()
        const antigos = posts.filter(p => {
          const ano = p.data_post?.split('/')?.[2]
          return ano && parseInt(ano, 10) < 2025
        })
        set(s => ({ posts: s.posts.filter(p => {
          const ano = p.data_post?.split('/')?.[2]
          return !ano || parseInt(ano, 10) >= 2025
        })}))
        await Promise.allSettled(
          antigos.map(p => removePost(p.id).catch(() => {}))
        )
        return antigos.length
      },

      // ── LinkedIn ───────────────────────────────────────
      addLinkedinPost: async (post) => {
        const novo = { ...post, id: post.id || String(Date.now()) }
        pendingLinkedinUpdates.set(novo.id, novo)
        set(s => ({ linkedinPosts: [...s.linkedinPosts, novo] }))
        upsertLinkedinPost(novo)
          .then(() => pendingLinkedinUpdates.delete(novo.id))
          .catch(e => { console.error('[linkedin add]', e); pendingLinkedinUpdates.delete(novo.id) })
      },

      updateLinkedinPost: async (post) => {
        pendingLinkedinUpdates.set(post.id, post)
        set(s => ({ linkedinPosts: s.linkedinPosts.map(p => p.id !== post.id ? p : { ...p, ...post }) }))
        upsertLinkedinPost(post)
          .then(() => pendingLinkedinUpdates.delete(post.id))
          .catch(e => { console.error('[linkedin update]', e); pendingLinkedinUpdates.delete(post.id) })
      },

      deleteLinkedinPost: async (id) => {
        pendingLinkedinUpdates.delete(id)
        set(s => ({ linkedinPosts: s.linkedinPosts.filter(p => p.id !== id) }))
        removeLinkedinPost(id).catch(e => console.error('[linkedin delete]', e))
      },

      setLinkedinPageData: async (chave, valores) => {
        const updated = { ...get().linkedinPageData, [chave]: valores }
        set({ linkedinPageData: updated })
        try { await saveSetting('linkedin_page_data', JSON.stringify(updated)) } catch (_) {}
      },

      setLinkedinSeguidores: async (n) => {
        set({ linkedinSeguidores: n })
        try { await saveSetting('linkedin_seguidores', String(n)) } catch (_) {}
      },

      deleteManyLinkedinPosts: async (ids) => {
        const idSet = new Set(ids)
        set(s => ({ linkedinPosts: s.linkedinPosts.filter(p => !idSet.has(p.id)) }))
        await Promise.allSettled(ids.map(id => removeLinkedinPost(id).catch(() => {})))
      },

      // ── Navarro ────────────────────────────────────────
      saveNavarroLink: async (link) => {
        const links = get().navarroLinks
        const exists = links.find(l => l.id === link.id)
        const updated = exists ? links.map(l => l.id === link.id ? link : l) : [...links, link]
        set({ navarroLinks: updated })
        saveSetting('navarro_links', JSON.stringify(updated)).catch(e => console.error('[navarro save]', e))
      },

      deleteNavarroLink: async (id) => {
        const updated = get().navarroLinks.filter(l => l.id !== id)
        set({ navarroLinks: updated })
        saveSetting('navarro_links', JSON.stringify(updated)).catch(e => console.error('[navarro delete]', e))
      },

      importLinkedinPosts: async (posts) => {
        const novos = posts.map(p => ({ ...p, id: p.id || crypto.randomUUID() }))
        set(s => ({ linkedinPosts: [...s.linkedinPosts, ...novos] }))
        await batchInsertLinkedinPosts(novos)
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
        if (
          _postsDoMesCache.posts === posts &&
          _postsDoMesCache.mesFiltro === mesFiltro
        ) return _postsDoMesCache.result
        const result = !mesFiltro ? posts : posts.filter((p) => {
          const parts = p.data_post?.split('/')
          if (!parts || parts.length < 3) return false
          return `${parts[1]}/${parts[2]}` === mesFiltro
        })
        _postsDoMesCache = { posts, mesFiltro, result }
        return result
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
        linkedinPosts:  s.linkedinPosts,
        linkedinPageData: s.linkedinPageData,
        linkedinSeguidores: s.linkedinSeguidores,
        navarroLinks:   s.navarroLinks,
        metaMensal:     s.metaMensal,
        metaAnual:      s.metaAnual,
        mesFiltro:      s.mesFiltro,
        apiKey:         s.apiKey,
        oliverData:     s.oliverData,
        isEditMode:     s.isEditMode,
      }),
    }
  )
)
