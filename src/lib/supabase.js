import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** null when env vars are missing → the app runs in Demo Mode. */
export const supabase = url && anonKey ? createClient(url, anonKey) : null
export const isSupabaseConfigured = Boolean(supabase)
export const requireAdminAuth = isSupabaseConfigured && import.meta.env.VITE_REQUIRE_ADMIN_AUTH === 'true'

/** Unwrap a Supabase response or throw. */
export async function q(promise) {
  const { data, error } = await promise
  if (error) throw error
  return data
}
