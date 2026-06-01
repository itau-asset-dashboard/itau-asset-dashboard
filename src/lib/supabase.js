import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, key)

// ── Posts ──────────────────────────────────────────────

export async function fetchPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

// Faz upload de uma imagem (base64 dataUrl) para o Storage e retorna a URL pública
export async function uploadImage(postId, dataUrl) {
  if (!dataUrl) return null
  // Converte base64 para Blob
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: mime })
  const ext = mime.includes('png') ? 'png' : 'jpg'
  const path = `${postId}.${ext}`

  const { error } = await supabase.storage
    .from('post-images')
    .upload(path, blob, { upsert: true, contentType: mime })
  if (error) throw error

  const { data } = supabase.storage.from('post-images').getPublicUrl(path)
  return data.publicUrl
}

export async function upsertPost(post) {
  // eslint-disable-next-line no-unused-vars
  const { apiKey, imageData, ...clean } = post   // nunca salva base64 no banco
  const { error } = await supabase.from('posts').upsert(clean)
  if (error) throw error
}

export async function deleteImage(postId) {
  // Tenta deletar jpg e png (não falha se não existir)
  await supabase.storage.from('post-images').remove([`${postId}.jpg`, `${postId}.png`])
}

export async function removePost(id) {
  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) throw error
}

// ── Settings ───────────────────────────────────────────

export async function fetchSetting(key) {
  const { data } = await supabase
    .from('dashboard_settings')
    .select('value')
    .eq('key', key)
    .single()
  return data?.value ?? null
}

export async function saveSetting(key, value) {
  await supabase
    .from('dashboard_settings')
    .upsert({ key, value: String(value) })
}
