import { supabase, q } from '../lib/supabase'

export const scamService = {
  list: () => q(supabase.from('scam_reports').select('*').order('created_at', { ascending: false })),
  create: (row) => q(supabase.from('scam_reports').insert(row)),
}
