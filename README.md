# Expenser 💰

A real-time shared expense tracking app for groups.

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with Google OAuth

## Project Structure

```
expenser-project/
├── frontend/          # React + Vite app
├── backend/           # Node.js + Express API
├── SUPABASE_SCHEMA.md # Database schema documentation
└── README.md
```

## Features (MVP)

- [x] Shared expense groups (real-time sync)
- [x] Google login (Supabase Auth)
- [x] Expense tracking with categories & subcategories
- [x] Predefined categories + ability to add custom ones
- [x] Auto-complete suggestions (learn from history)
- [x] Complete expense history
- [x] Web app

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account (https://supabase.com)

### Setup

1. **Create Supabase Project**
   - Go to https://supabase.com and create a new project
   - Set up database tables using `SUPABASE_SCHEMA.md`
   - Enable Google OAuth in Auth settings

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   # Fill in your Supabase credentials
   npm run dev
   ```

3. **(Optional) Skip Google login while developing**

   Create a test user in your Supabase project (Authentication > Users > Add
   user, with a password), then in `frontend/.env.local` (gitignored):

   ```
   VITE_AUTH_BYPASS=true
   VITE_DEV_USER_EMAIL=dev@example.com
   VITE_DEV_USER_PASSWORD=your-local-test-password
   ```

   `npm run dev` then auto signs in with that account. It is a *real* Supabase
   session, so RLS works and the app is fully usable, and a yellow banner stays
   on screen the whole time. The bypass is additionally gated on
   `import.meta.env.DEV`, so it is stripped from production builds and cannot be
   turned on there by any env var.

4. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Fill in your Supabase credentials
   npm start
   ```

## Environment Variables

See `.env.example` files in each directory for required variables.
