# Google OAuth Setup Guide

## Step 1: Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Click **Settings** (gear icon) → **API**
3. Copy and save:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (optional, for backend)

Add these to your `.env` files:

**frontend/.env.local**
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**backend/.env** (optional)
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 2: Enable Google OAuth in Supabase

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click to expand
3. Click **Enable**
4. You'll see two fields:
   - **Client ID**
   - **Client Secret**

Leave these empty for now — we'll get them from Google Cloud.

## Step 3: Create Google OAuth Credentials

### Get Google OAuth Keys

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**:
   - Click **Enable APIs and Services**
   - Search for "Google+ API"
   - Click **Enable**

### Create OAuth 2.0 Credentials

1. Go to **Credentials** (left sidebar)
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Select **Web application**
4. Add **Authorized redirect URIs**:
   ```
   https://xxxxx.supabase.co/auth/v1/callback
   http://localhost:5173/
   ```
   (Replace `xxxxx` with your Supabase project name)

5. Click **Create**
6. You'll get:
   - **Client ID**
   - **Client Secret**

## Step 4: Add Google Credentials to Supabase

1. Back in Supabase Authentication → Providers → Google
2. Paste:
   - **Client ID** from Google Cloud
   - **Client Secret** from Google Cloud
3. Click **Save**

## Step 5: Configure Redirect URLs in Supabase

1. In Supabase, go to **Authentication** → **URL Configuration**
2. Add these **Redirect URLs**:
   ```
   http://localhost:5173
   http://localhost:5173/auth/callback
   https://yourdomain.com
   https://yourdomain.com/auth/callback
   ```

3. In **Site URL**, set:
   ```
   http://localhost:5173
   ```
   (Change to your production URL when deploying)

## Step 6: Test Login Flow

1. Make sure `.env.local` has your Supabase credentials
2. Run frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Try signing in with Google button

## Common Issues

### "Redirect URL mismatch"
- Make sure redirect URLs in Google Cloud Console AND Supabase match your app URL
- Include both `http://localhost:5173` for dev and your production URL

### "OAuth app not created"
- Go back to Google Cloud Console → Credentials
- Make sure you created "OAuth 2.0 Client ID" for "Web application"

### User not synced to database
- Check that RLS policies allow unauthenticated users to insert into `users` table during signup
- Or use Supabase Triggers to auto-create user records

## Next: Auto-create User Records

We'll add a database trigger to automatically create a user record when someone signs up via Google OAuth. This will populate the `users` table with their Google info.
