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

export async function upsertPost(post) {
  // eslint-disable-next-line no-unused-vars
  const { apiKey, ...clean } = post   // nunca salva a chave de API
  const { error } = await supabase.from('posts').upsert(clean)
  if (error) throw error
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
