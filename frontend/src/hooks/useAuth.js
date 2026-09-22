import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  AUTH_BYPASS_ENABLED,
  DEV_CREDENTIALS_PRESENT,
  DEV_USER_EMAIL,
  DEV_USER_PASSWORD,
  MISSING_CREDENTIALS_MESSAGE
} from '../lib/devAuth'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Only ever true on a dev server with VITE_AUTH_BYPASS=true. See lib/devAuth.js.
  const [bypassError, setBypassError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const getSession = async () => {
      try {
        let { data: { session } } = await supabase.auth.getSession()

        // The dev sign-in lives entirely inside this branch, and the literal
        // import.meta.env.DEV (not only the one inside AUTH_BYPASS_ENABLED)
        // lets Vite constant-fold the condition to `false` in a production
        // build, so the whole block is stripped from the bundle.
        if (!session && import.meta.env.DEV && AUTH_BYPASS_ENABLED) {
          // Signs in a *real* Supabase session with the dev test account, so
          // the JWT is genuine and every RLS policy keyed on auth.uid() keeps
          // working -- unlike a client-side mock user, which would show an
          // empty app.
          if (!DEV_CREDENTIALS_PRESENT) {
            setBypassError(MISSING_CREDENTIALS_MESSAGE)
          } else {
            const { data, error: signInError } =
              await supabase.auth.signInWithPassword({
                email: DEV_USER_EMAIL,
                password: DEV_USER_PASSWORD
              })
            if (signInError) {
              setBypassError(
                `Dev auto sign-in failed for ${DEV_USER_EMAIL}: ${signInError.message}`
              )
            } else {
              session = data.session
            }
          }
        }

        if (!cancelled) setUser(session?.user || null)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      cancelled = true
      subscription?.unsubscribe()
    }
  }, [])

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      })
      if (error) throw error
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
    // Dev-only diagnostics, always false/null in a production build.
    bypassEnabled: AUTH_BYPASS_ENABLED,
    bypassError
  }
}
