/**
 * Local-development auth bypass.
 *
 * Why a real sign-in and not a fake user object:
 * every table is protected by RLS keyed on `auth.uid()`, and `public.users.id`
 * is the auth user id (see supabase/migrations/002_fix_user_ids_and_rls.sql).
 * A mock user would get past the login screen and then hit an app where every
 * query returns empty, because without a JWT `auth.uid()` is NULL. So instead
 * we sign in for real with a dedicated test account via email/password. That
 * yields a genuine session, and RLS behaves exactly as in production.
 *
 * SAFETY: this can only ever activate in a dev server run.
 * `import.meta.env.DEV` is statically replaced with `false` by Vite in a
 * production build, so the whole branch below is constant-folded away and
 * dead-code eliminated from the bundle. The explicit VITE_AUTH_BYPASS opt-in
 * is required on top of that, so it stays off by default even locally.
 */
export const AUTH_BYPASS_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS === 'true'

export const DEV_USER_EMAIL = AUTH_BYPASS_ENABLED
  ? import.meta.env.VITE_DEV_USER_EMAIL
  : undefined

export const DEV_USER_PASSWORD = AUTH_BYPASS_ENABLED
  ? import.meta.env.VITE_DEV_USER_PASSWORD
  : undefined

export const DEV_CREDENTIALS_PRESENT = Boolean(
  AUTH_BYPASS_ENABLED && DEV_USER_EMAIL && DEV_USER_PASSWORD
)

export const MISSING_CREDENTIALS_MESSAGE =
  'VITE_AUTH_BYPASS=true but VITE_DEV_USER_EMAIL / VITE_DEV_USER_PASSWORD are not set in frontend/.env.local'
