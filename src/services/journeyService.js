import { supabase, q } from '../lib/supabase'

// Supabase data access for journeys. UI never calls supabase directly.
export const journeyService = {
  list: () => q(supabase.from('journeys').select('*').order('created_at', { ascending: false })),
  create: (row) => q(supabase.from('journeys').insert(row)),
  update: (id, patch) => q(supabase.from('journeys').update(patch).eq('id', id)),
  listUpdates: () => q(supabase.from('journey_updates').select('*').order('created_at', { ascending: false }).limit(500)),
  addUpdate: (row) => q(supabase.from('journey_updates').insert(row)),
  /** Public tracking: security-definer RPC returning only safe fields. */
  getShared: async (token) => (await q(supabase.rpc('get_shared_journey', { p_token: token })))?.[0] ?? null,
  /** Restores seed data (demo-only SQL function, see migrations). */
  resetDemo: () => q(supabase.rpc('reset_demo')),
}
