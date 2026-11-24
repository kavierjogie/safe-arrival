import { supabase, q } from '../lib/supabase'

export const hotelService = {
  list: () => q(supabase.from('hotels').select('*').order('name')),
  listNotifications: () => q(supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(200)),
  notify: (row) => q(supabase.from('notifications').insert(row)),
  markRead: (id, read_at) => q(supabase.from('notifications').update({ read_at }).eq('id', id)),
}
