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

export default function App() {
  const { activeSection, syncFromCloud } = useStore()

  // Carrega dados do Supabase ao abrir
  useEffect(() => { syncFromCloud() }, [])

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', minWidth: 0 }}>
        <TopBar />
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }} className="scrollbar-thin">
          {activeSection === 'upload'   && <UploadSection />}
          {activeSection === 'insights' && <Insights />}
          {activeSection === 'posts'    && <PostsRanking />}
          {(activeSection === 'visao-geral' || activeSection === 'meta') && (
            <>
              <KPICards />
              <PostsChart />
              <TypeComparison />
              <ThemeAnalysis />
            </>
          )}
        </div>
      </div>

      <RightPanel />
      <SyncBadge />
    </div>
  )
}
