import { useEffect } from 'react'
import './App.css'
import { useStore } from './store/useStore'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import KPICards from './components/KPICards'
import PostsChart from './components/PostsChart'
import PostsRanking from './components/PostsRanking'
import TypeComparison from './components/TypeComparison'
import ThemeAnalysis from './components/ThemeAnalysis'
import Insights from './components/Insights'
import UploadSection from './components/UploadSection'
import SyncBadge from './components/SyncBadge'
import AnnualView from './components/AnnualView'
import TopPostsMes from './components/TopPostsMes'
import ETFsView from './components/ETFsView'
import OliverView from './components/OliverView'
import Glossario from './components/Glossario'
import StoriesView from './components/StoriesView'
import MetaMensalBanner from './components/MetaMensalBanner'

// Limpa dados pesados do localStorage logo na inicialização (roda antes do React montar).
// Remove imageData de posts, e limpa stories/insights que não precisam mais ser persistidos.
;(function cleanLocalStorage() {
  try {
    const raw = localStorage.getItem('itau-asset-instagram')
    if (!raw) return
    const parsed = JSON.parse(raw)
    const state = parsed?.state
    if (!state) return
    let dirty = false

    // Remove imageData de posts
    if (state.posts?.some(p => p.imageData)) {
      state.posts = state.posts.map(({ imageData, ...p }) => p)
      dirty = true
    }

    // Remove stories do localStorage (Supabase é a fonte da verdade)
    if (state.stories !== undefined) {
      delete state.stories
      dirty = true
    }

    // Remove insights do localStorage (gerados sob demanda)
    if (state.insights !== undefined) {
      delete state.insights
      dirty = true
    }

    if (dirty) {
      localStorage.setItem('itau-asset-instagram', JSON.stringify(parsed))
      console.log('[startup] localStorage limpo (stories/insights/imageData removidos)')
    }
  } catch (_) {}
})()

export default function App() {
  const { activeSection, syncFromCloud } = useStore()

  useEffect(() => {
    document.querySelector('.content-scroll')?.scrollTo({ top: 0, behavior: 'instant' })
  }, [activeSection])

  useEffect(() => {
    // Sync inicial
    syncFromCloud()

    // Re-sync quando o usuário volta para a aba/app (mobile ou desktop)
    function onVisible() {
      if (document.visibilityState === 'visible') syncFromCloud()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-column">
        <TopBar />
        <div className="content-scroll scrollbar-thin">
          {activeSection === 'upload'      && <UploadSection />}
          {activeSection === 'insights'    && <Insights />}
          {activeSection === 'oliver'      && <OliverView />}
          {activeSection === 'posts'       && <PostsRanking />}
          {activeSection === 'etfs'        && <ETFsView />}
          {activeSection === 'glossario'   && <Glossario />}
          {activeSection === 'stories'     && <StoriesView />}
          {activeSection === 'visao-anual' && <AnnualView />}
          {activeSection === 'visao-geral' && (
            <>
              <KPICards />
              <MetaMensalBanner />
              <TopPostsMes />
              <PostsChart />
              <TypeComparison />
              <ThemeAnalysis />
            </>
          )}
        </div>
      </div>

    </div>
  )
}
