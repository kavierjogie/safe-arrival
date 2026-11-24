import { supabase, q } from '../lib/supabase'

export const driverService = {
  list: () => q(supabase.from('drivers').select('*').order('driver_reference')),
  update: (id, patch) => q(supabase.from('drivers').update(patch).eq('id', id)),
}
