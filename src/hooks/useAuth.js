import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)

      // Limpa URL após login OAuth
      if (event === 'SIGNED_IN' && window.location.search.includes('code=')) {
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' }, // força escolha de conta
      },
    })

  const signInWithGithub = () =>
    supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin },
    })

  const signOut = async () => {
    // Limpa sessão local E no servidor
    await supabase.auth.signOut({ scope: 'local' })
    setUser(null)
    // Limpa qualquer resquício de cache do Supabase no storage
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('sb-')) localStorage.removeItem(k)
    })
    window.location.href = '/' // força reload completo da página
  }

  return { user, loading, signInWithGoogle, signInWithGithub, signOut }
}
