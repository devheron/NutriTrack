import { supabase } from '../lib/supabase'

async function requireUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Sessão expirada. Faça login novamente.')
  return user
}

export const goalsService = {
  async get() {
    const user = await requireUser()
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    if (error) throw error
    return data || { calories_goal: 2500, protein_goal: 150 }
  },

  async save(goals) {
    const user = await requireUser()
    const { data, error } = await supabase
      .from('user_goals')
      .upsert({ user_id: user.id, ...goals }, { onConflict: 'user_id' })
      .select()
      .single()
    if (error) throw error
    return data
  },
}
