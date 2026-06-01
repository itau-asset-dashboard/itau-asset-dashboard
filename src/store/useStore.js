import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetchPosts, upsertPost, removePost, fetchSetting, saveSetting, uploadImage, deleteImage } from '../lib/supabase'
import { normalizeTema } from '../utils/temas'

export const useStore = create(
  persist(
    (set, get) => ({
      posts: [],
      metaMensal: 200000,
      metaAnual: 1090000,
      mesFiltro: '01/2026',
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
          const dirty = [] // posts com tema sujo que precisam ser re-salvos
          const posts = cloudPosts.map(cp => {
            const local = localPosts.find(lp => lp.id === cp.id)
            const merged = local?.imageData ? { ...cp, imageData: local.imageData } : cp
            const temaNorm = normalizeTema(merged.tema)
            // Detecta se o tema estava sujo (string ≠ array limpo)
            const temaOriginal = JSON.stringify(merged.tema)
            const temaLimpo    = JSON.stringify(temaNorm)
            if (temaOriginal !== temaLimpo) dirty.push({ ...merged, tema: temaNorm })
            return { ...merged, tema: temaNorm }
          })
          set({
            posts,
            metaMensal: metaMensal ? Number(metaMensal) : get().metaMensal,
            metaAnual:  metaAnual  ? Number(metaAnual)  : get().metaAnual,
            syncing: false,
          })
          // Grava de volta no Supabase os posts com tema corrigido
          if (dirty.length > 0) {
            dirty.forEach(p => { try { upsertPost(p) } catch (_) {} })
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

      // Meta mensal ajustada: redistribui o saldo restante entre os meses que faltam
      getMetaMesAjustada: (mesFiltroParam) => {
        const { posts, metaAnual, mesFiltro } = get()
        const filtro = mesFiltroParam || mesFiltro
        if (!filtro) return Math.round(metaAnual / 12)

        const [mmStr, yyyy] = filtro.split('/')
        const mesAtual = parseInt(mmStr, 10) // 1-12

        // Total já alcançado nos meses ANTERIORES ao mês filtrado (meses finalizados)
        const totalAnterior = posts.reduce((s, p) => {
          const pts = p.data_post?.split('/')
          if (!pts || pts[2] !== yyyy) return s
          const mes = parseInt(pts[1], 10)
          if (mes < mesAtual) return s + (p.contas_alcancadas || 0)
          return s
        }, 0)

        // Meses restantes (incluindo o mês atual)
        const mesesRestantes = 12 - mesAtual + 1
        if (mesesRestantes <= 0) return 0

        // Meta ajustada = saldo restante / meses restantes
        const saldo = Math.max(metaAnual - totalAnterior, 0)
        return Math.round(saldo / mesesRestantes)
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
        posts:      s.posts,
        metaMensal: s.metaMensal,
        metaAnual:  s.metaAnual,
        mesFiltro:  s.mesFiltro,
        insights:   s.insights,
        apiKey:     s.apiKey,
      }),
    }
  )
)
