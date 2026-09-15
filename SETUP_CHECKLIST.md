# Expenser Setup Checklist

## ✅ Done
- [x] Project structure created
- [x] Supabase schema deployed
- [x] Frontend scaffolding (React + Vite)
- [x] Backend scaffolding (Node + Express)
- [x] Auth hooks and context
- [x] Login page with Google OAuth button

## 📋 Next Steps

### 1. Get Supabase Credentials

Go to your Supabase project:
- **Settings** → **API**
- Copy **Project URL** and **Anon Key**

### 2. Set Up Google OAuth

Follow `GOOGLE_OAUTH_SETUP.md`:
- [ ] Create Google Cloud project
- [ ] Enable Google+ API
- [ ] Create OAuth 2.0 credentials
- [ ] Add redirect URLs (localhost + production)
- [ ] Copy Client ID and Secret
- [ ] Paste into Supabase Auth providers

### 3. Create Auto-sync Trigger

Run the SQL from `SUPABASE_TRIGGERS.md` in Supabase SQL Editor:
- [ ] `handle_new_user()` function
- [ ] `on_auth_user_created` trigger

### 4. Fill Environment Variables

**frontend/.env.local**
```bash
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**backend/.env** (optional for now)
```bash
SUPABASE_URL=your-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3001
NODE_ENV=development
```

### 5. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
npm install
```

### 6. Test Login Flow

```bash
# Terminal 1: Frontend
cd frontend
npm run dev
# Visit http://localhost:5173

# Terminal 2 (optional): Backend
cd backend
npm run dev
```

Try the "Sign in with Google" button!

## 🎯 What Should Happen

1. Click "Sign in with Google"
2. Google redirect happens
3. You're redirected back to `/dashboard`
4. User record auto-created in Supabase `users` table
5. See "Welcome, your-email@gmail.com"

## 🚨 Troubleshooting

### "Redirect URL mismatch"
- Check Google Cloud → Credentials → Authorized redirect URIs
- Check Supabase → Auth → URL Configuration
- Both should include `http://localhost:5173`

### "env variables missing"
- Make sure `.env.local` (frontend) is in the root of `frontend/` folder
- Reload the dev server after adding variables
- Check browser console for errors

### User not appearing in database
- Go to Supabase → Table Editor → `users`
- Make sure trigger was created (Functions & Triggers)
- Check if auth user was created (Authentication → Users)

## 📦 What's Ready

- ✅ Google OAuth sign in
- ✅ Auto user sync to database
- ✅ Protected routes
- ⏳ Groups CRUD (in backend, need UI)
- ⏳ Expenses CRUD (in backend, need UI)
- ⏳ Auto-complete (in backend, need UI)

Next: Build Groups and Expenses UI! 🚀
