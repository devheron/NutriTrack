import { supabase } from '../lib/supabase'

async function requireUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Sessão expirada. Faça login novamente.')
  return user
}

export const foodItemsService = {
  async getAll() {
    const user = await requireUser()
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async create(item) {
    const user = await requireUser()
    const { _photoFile, ...rest } = item
    // Garante que user_id nunca vem do payload externo
    const payload = { ...rest, user_id: user.id }
    delete payload.id // nunca passa id no insert
    const { data, error } = await supabase
      .from('food_items')
      .insert(payload)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, item) {
    const user = await requireUser()
    const { _photoFile, id: _id, user_id: _uid, ...rest } = item
    const { data, error } = await supabase
      .from('food_items')
      .update(rest)
      .eq('id', id)
      .eq('user_id', user.id) // só atualiza se for dono
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(id) {
    const user = await requireUser()
    const { error } = await supabase
      .from('food_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // só deleta se for dono
    if (error) throw error
  },

  async uploadPhoto(file, itemId) {
    const user = await requireUser()
    const ext  = file.name.split('.').pop()
    const path = `${user.id}/${itemId}.${ext}`
    const { error } = await supabase.storage
      .from('product-photos')
      .upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('product-photos').getPublicUrl(path)
    return data.publicUrl
  },
}
