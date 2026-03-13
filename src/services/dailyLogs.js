import { supabase } from '../lib/supabase'

async function requireUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Sessão expirada. Faça login novamente.')
  return user
}

export const dailyLogsService = {
  async getByDate(date) {
    const user = await requireUser()
    const { data, error } = await supabase
      .from('daily_logs')
      .select(`*, food_items(*)`)
      .eq('user_id', user.id)
      .eq('log_date', date)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  },

  async add(entry) {
    const user = await requireUser()
    const { data, error } = await supabase
      .from('daily_logs')
      .insert({ ...entry, user_id: user.id })
      .select(`*, food_items(*)`)
      .single()
    if (error) throw error
    return data
  },

  async remove(id) {
    const user = await requireUser()
    const { error } = await supabase
      .from('daily_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) throw error
  },
}
