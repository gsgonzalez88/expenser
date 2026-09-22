import { useAuthContext } from '../context/AuthContext'
import { AUTH_BYPASS_ENABLED } from '../lib/devAuth'

/**
 * Persistent, impossible-to-miss marker that the login gate is being bypassed.
 * Renders nothing unless the dev bypass is on, and the whole component is
 * dead-code eliminated from production builds (AUTH_BYPASS_ENABLED folds to
 * false there — see lib/devAuth.js).
 */
export const DevAuthBanner = () => {
  const { user, bypassError } = useAuthContext()

  if (!import.meta.env.DEV || !AUTH_BYPASS_ENABLED) return null

  const broken = Boolean(bypassError) || !user

  return (
    <div
      role="status"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        padding: '8px 16px',
        textAlign: 'center',
        fontSize: '13px',
        fontWeight: 600,
        lineHeight: 1.4,
        color: '#1a1a1a',
        background: broken
          ? 'repeating-linear-gradient(45deg, #ff6b6b, #ff6b6b 12px, #ffd93d 12px, #ffd93d 24px)'
          : 'repeating-linear-gradient(45deg, #ffd93d, #ffd93d 12px, #ffb703 12px, #ffb703 24px)'
      }}
    >
      {broken ? (
        <>
          DEV AUTH BYPASS FAILED — you are NOT signed in, so RLS will reject
          every query. {bypassError || 'No Supabase session was created.'}
        </>
      ) : (
        <>
          DEV AUTH BYPASS ACTIVE — signed in as {user.email} via
          VITE_DEV_USER_EMAIL. This is a real Supabase session, not real Google
          login. Never enable outside local development.
        </>
      )}
    </div>
  )
}
