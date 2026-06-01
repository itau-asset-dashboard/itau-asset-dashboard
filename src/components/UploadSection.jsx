import { useState } from 'react'
import { Upload, Sparkles } from 'lucide-react'
import { useStore } from '../store/useStore'
import UploadModal from './UploadModal'

export default function UploadSection() {
  const { addPost } = useStore()
  const [open, setOpen] = useState(false)

  return (
    <div style={{ paddingTop:4 }}>
      <div style={{ marginBottom:16 }}>
        <h2 style={{ color:'#1C252E', fontSize:15, fontWeight:700 }}>Adicionar post</h2>
        <p style={{ color:'#8A9BB0', fontSize:12, marginTop:2 }}>Extração automática de métricas via IA</p>
      </div>

      <div className="card" style={{
        padding:'48px 32px', display:'flex', flexDirection:'column', alignItems:'center', gap:16,
        cursor:'pointer', border:'2px dashed #D8EEF6', boxShadow:'none', background:'#FAFCFE', transition:'all 0.15s',
      }}
        onClick={()=>setOpen(true)}
        onMouseEnter={e=>{e.currentTarget.style.background='#F0F8FF';e.currentTarget.style.borderColor='#C3EBF7'}}
        onMouseLeave={e=>{e.currentTarget.style.background='#FAFCFE';e.currentTarget.style.borderColor='#D8EEF6'}}
      >
        <div style={{ width:60, height:60, borderRadius:16, background:'rgba(195,235,247,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Upload size={26} color="#1a7a96"/>
        </div>
        <div style={{ textAlign:'center' }}>
          <p style={{ color:'#1C252E', fontSize:16, fontWeight:700, marginBottom:5 }}>Arraste o print aqui</p>
          <p style={{ color:'#8A9BB0', fontSize:13 }}>ou clique para selecionar uma imagem</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(195,235,247,0.35)', border:'1px solid rgba(195,235,247,0.8)', padding:'7px 14px', borderRadius:20 }}>
          <Sparkles size={13} color="#1a7a96"/>
          <span style={{ color:'#1a7a96', fontSize:12, fontWeight:600 }}>Extração automática via Claude IA</span>
        </div>
      </div>

      {open && (
        <UploadModal mode="new" onClose={()=>setOpen(false)}
          onSave={dados=>addPost(dados)}/>
      )}
    </div>
  )
}
