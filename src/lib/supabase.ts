// Supabase client — optional, uses localStorage if not configured
import { config, hasSupabase } from './config.ts'

const headers: Record<string, string> = hasSupabase() ? {
  'apikey': config.supabaseKey,
  'Authorization': `Bearer ${config.supabaseKey}`,
  'Content-Type': 'application/json',
} : {}

export async function loadStore<T>(key: string): Promise<T | null> {
  if (!hasSupabase()) return null
  const url = `${config.supabaseUrl}/rest/v1/json_store?key=eq.${encodeURIComponent(key)}&select=value`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`Supabase load failed: ${res.status}`)
  const rows = await res.json()
  if (!rows.length) return null
  return rows[0].value as T
}

export async function saveStore(key: string, value: unknown): Promise<void> {
  if (!hasSupabase()) return
  const url = `${config.supabaseUrl}/rest/v1/json_store`
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
    body: JSON.stringify({ key, value }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase save failed: ${res.status} ${text}`)
  }
}
