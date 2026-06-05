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
import RightPanel from './components/RightPanel'
import SyncBadge from './components/SyncBadge'
import AnnualView from './components/AnnualView'
import TopPostsMes from './components/TopPostsMes'
import ETFsView from './components/ETFsView'
import OliverView from './components/OliverView'
import Glossario from './components/Glossario'
import StoriesView from './components/StoriesView'
import MetaMensalBanner from './components/MetaMensalBanner'

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

  const showRight = activeSection === 'visao-geral'

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

      {showRight && <RightPanel />}
    </div>
  )
}
