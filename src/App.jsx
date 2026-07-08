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
import RightPanel from './components/RightPanel'
import AnnualView from './components/AnnualView'
import TopPostsMes from './components/TopPostsMes'
import ETFsView from './components/ETFsView'
import OliverView from './components/OliverView'
import Glossario from './components/Glossario'
import StoriesView from './components/StoriesView'
import MetaMensalBanner from './components/MetaMensalBanner'
import LinkedinView from './components/LinkedinView'
import LinkedinPaginaView from './components/LinkedinPaginaView'

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
  const { activeSection, syncFromCloud, hasSynced, linkedinPageData, setLinkedinPageData, linkedinSeguidores, setLinkedinSeguidores, isEditMode } = useStore()

  // Mantém hash sincronizado com a seção ativa (persiste no refresh)
  useEffect(() => {
    window.location.hash = activeSection
    document.querySelector('.content-scroll')?.scrollTo({ top: 0, behavior: 'instant' })
  }, [activeSection])

  useEffect(() => {
    // Sync inicial
    syncFromCloud()

    // Re-sync quando o usuário volta para a aba/app (mobile ou desktop)
    function onVisible() {
      if (document.visibilityState === 'visible') syncFromCloud()
    }
    // pageshow cobre o bfcache do iOS Safari: página restaurada do cache sem recarregar
    function onPageShow(e) {
      if (e.persisted) syncFromCloud()
    }
    // Refresh automático a cada 60s para garantir sincronia entre dispositivos
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') syncFromCloud()
    }, 60_000)

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

  if (!hasSynced) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100dvh', background:'#F6F8FA', gap:16 }}>
      <svg width={48} height={48} viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="26" fill="#1C252E"/>
        <text x="50" y="68" textAnchor="middle" fontFamily="'DM Sans',sans-serif" fontWeight="900" fontSize="38" fill="#C3EBF7" letterSpacing="-1">itaú</text>
      </svg>
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'#FF6200', animation:'bounce 1.2s ease-in-out infinite', animationDelay:`${i*0.2}s` }}/>
        ))}
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:0.4}40%{transform:translateY(-6px);opacity:1}}`}</style>
    </div>
  )

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
          {activeSection === 'linkedin-geral'       && <LinkedinView tab="geral" />}
          {activeSection === 'linkedin-posts'       && <LinkedinView tab="biblioteca" />}
          {activeSection === 'linkedin-performance' && <LinkedinView tab="formato" />}
          {activeSection === 'linkedin-pilula'      && <LinkedinView tab="pilula" />}
          {activeSection === 'linkedin-pagina'      && <LinkedinPaginaView data={linkedinPageData} seguidores={linkedinSeguidores} ano={String(new Date().getFullYear())} isEditMode={isEditMode} onSave={setLinkedinPageData} onSaveSeguidores={setLinkedinSeguidores}/>}
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

      {activeSection === 'visao-geral' && <RightPanel />}
    </div>
  )
}
