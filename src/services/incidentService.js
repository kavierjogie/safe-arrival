import { supabase, q } from '../lib/supabase'

export const incidentService = {
  list: () => q(supabase.from('incidents').select('*').order('created_at', { ascending: false })),
  create: (row) => q(supabase.from('incidents').insert(row)),
  update: (id, patch) => q(supabase.from('incidents').update(patch).eq('id', id)),
  listNotes: () => q(supabase.from('incident_notes').select('*').order('created_at', { ascending: true })),
  addNote: (row) => q(supabase.from('incident_notes').insert(row)),
}
