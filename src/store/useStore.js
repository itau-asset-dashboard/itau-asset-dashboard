import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetchPosts, upsertPost, removePost, fetchSetting, saveSetting } from '../lib/supabase'

export const useStore = create(
  persist(
    (set, get) => ({
      posts: [],
      metaMensal: 200000,
      metaAnual: 1090000,
      mesFiltro: '01/2026',
      activeSection: 'visao-geral',
      insights: [],
      loadingInsights: false,
      syncing: false,
      syncError: null,
      apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',

      // ── Sync inicial com Supabase ──────────────────────
      syncFromCloud: async () => {
        set({ syncing: true, syncError: null })
        try {
          const [posts, metaMensal, metaAnual] = await Promise.all([
            fetchPosts(),
            fetchSetting('meta_mensal'),
            fetchSetting('meta_anual'),
          ])
          set({
            posts,
            metaMensal: metaMensal ? Number(metaMensal) : get().metaMensal,
            metaAnual:  metaAnual  ? Number(metaAnual)  : get().metaAnual,
            syncing: false,
          })
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
        const novo = {
          nome: '', interacoes: null, ...post,
          id: Date.now().toString(),
          historico: [],
          atualizado_em: null,
        }
        set((s) => ({ posts: [...s.posts, novo] }))
        try { await upsertPost(novo) } catch (_) {}
      },

      updatePost: async (id, newData) => {
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
            return { ...p, ...newData, historico, atualizado_em: new Date().toLocaleDateString('pt-BR') }
          })
          return { posts }
        })
        const updated = get().posts.find((p) => p.id === id)
        if (updated) try { await upsertPost(updated) } catch (_) {}
      },

      deletePost: async (id) => {
        set((s) => ({ posts: s.posts.filter((p) => p.id !== id) }))
        try { await removePost(id) } catch (_) {}
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
