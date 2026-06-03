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
  // Normaliza image_url (coluna Supabase) → imageUrl (frontend)
  return (data || []).map(({ image_url, ...rest }) => ({
    ...rest,
    imageUrl: image_url || null,
  }))
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

// Colunas que existem na tabela posts do Supabase
const POST_COLUMNS = [
  'id','nome','tema','data_post','tipo','descricao',
  'contas_alcancadas','visualizacoes','curtidas','comentarios','salvamentos','compartilhamentos',
  'status','historico','atualizado_em','image_url',
]

export async function upsertPost(post) {
  const { apiKey, imageData, imageUrl, imagePreview, data_evidencia, ...rest } = post
  // Mantém só as colunas conhecidas para não quebrar se houver campos novos no frontend
  const clean = Object.fromEntries(
    Object.entries(rest).filter(([k]) => POST_COLUMNS.includes(k))
  )
  const { error } = await supabase.from('posts').upsert({ ...clean, image_url: imageUrl || null })
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

// ── Stories ────────────────────────────────────────────

export async function fetchStories() {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map(({ image_url, ...rest }) => ({
    ...rest,
    imageUrl: image_url || null,
  }))
}

export async function uploadStoryImage(storyId, dataUrl) {
  if (!dataUrl) return null
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: mime })
  const ext = mime.includes('png') ? 'png' : 'jpg'
  const path = `${storyId}.${ext}`
  const { error } = await supabase.storage
    .from('story-images')
    .upload(path, blob, { upsert: true, contentType: mime })
  if (error) throw error
  const { data } = supabase.storage.from('story-images').getPublicUrl(path)
  return data.publicUrl
}

const STORY_COLUMNS = [
  'id','nome','data','grupo','visualizacoes','interacoes','atividade_perfil',
  'contas_alcancadas','respostas','toques_avancar','toques_retroceder','saidas',
  'image_url','status',
]

export async function upsertStory(story) {
  const { imageData, imageUrl, imagePreview, ...rest } = story
  const clean = Object.fromEntries(
    Object.entries(rest).filter(([k]) => STORY_COLUMNS.includes(k))
  )
  const body = { ...clean, image_url: imageUrl || null }
  const response = await fetch(`${url}/rest/v1/stories`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || `Erro ${response.status}`)
  }
}

export async function removeStory(id) {
  const { error } = await supabase.from('stories').delete().eq('id', id)
  if (error) throw error
}

export async function deleteStoryImage(storyId) {
  await supabase.storage.from('story-images').remove([`${storyId}.jpg`, `${storyId}.png`])
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
