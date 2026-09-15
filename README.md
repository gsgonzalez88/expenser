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

3. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Fill in your Supabase credentials
   npm start
   ```

## Environment Variables

See `.env.example` files in each directory for required variables.
