# Supabase Schema Setup

> **Note:** the SQL below is the initial schema (already applied). Later changes live in `supabase/migrations/` and must be run in order. `002_fix_user_ids_and_rls.sql` supersedes the RLS section and `SUPABASE_TRIGGERS.md`.

This document contains the SQL schema for Expenser. Copy and paste this into your Supabase SQL editor.

## Database Schema

### 1. Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);
```

### 2. Groups Table

```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_groups_created_by ON groups(created_by);
```

### 3. Group Members Table

```sql
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
```

### 4. Categories Table

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50), -- emoji or icon name
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_is_default ON categories(is_default);

-- Seed default categories
INSERT INTO categories (name, icon, is_default) VALUES
('Comida', '🍔', TRUE),
('Transporte', '🚗', TRUE),
('Entretenimiento', '🎬', TRUE),
('Salud', '⚕️', TRUE),
('Compras', '🛍️', TRUE),
('Servicios', '🔧', TRUE),
('Viaje', '✈️', TRUE),
('Otro', '📦', TRUE)
ON CONFLICT DO NOTHING;
```

### 5. Subcategories Table

```sql
CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(category_id, name)
);

CREATE INDEX idx_subcategories_category_id ON subcategories(category_id);

-- Seed some common subcategories
INSERT INTO subcategories (category_id, name) VALUES
-- Comida
((SELECT id FROM categories WHERE name = 'Comida'), 'Supermercado'),
((SELECT id FROM categories WHERE name = 'Comida'), 'Restaurante'),
((SELECT id FROM categories WHERE name = 'Comida'), 'Café'),
((SELECT id FROM categories WHERE name = 'Comida'), 'Delivery'),
-- Transporte
((SELECT id FROM categories WHERE name = 'Transporte'), 'Gasolina'),
((SELECT id FROM categories WHERE name = 'Transporte'), 'Uber/Taxi'),
((SELECT id FROM categories WHERE name = 'Transporte'), 'Transporte Público'),
-- Entretenimiento
((SELECT id FROM categories WHERE name = 'Entretenimiento'), 'Cine'),
((SELECT id FROM categories WHERE name = 'Entretenimiento'), 'Conciertos'),
((SELECT id FROM categories WHERE name = 'Entretenimiento'), 'Juegos')
ON CONFLICT DO NOTHING;
```

### 6. Expenses Table

```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  paid_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_group_id ON expenses(group_id);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);
```

### 7. Expense Participants Table

```sql
CREATE TABLE expense_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  share DECIMAL(12, 2) NOT NULL, -- amount each person owes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(expense_id, user_id)
);

CREATE INDEX idx_expense_participants_expense_id ON expense_participants(expense_id);
CREATE INDEX idx_expense_participants_user_id ON expense_participants(user_id);
```

### 8. Expense Suggestions Table (for auto-complete)

```sql
CREATE TABLE expense_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE CASCADE,
  usage_count INT DEFAULT 1,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, group_id, description, category_id)
);

CREATE INDEX idx_expense_suggestions_user_id ON expense_suggestions(user_id);
CREATE INDEX idx_expense_suggestions_group_id ON expense_suggestions(group_id);
```

## Row Level Security (RLS)

Enable RLS on all tables and add these policies:

### Users Table

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile and other users in their groups
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = auth_id::text);

CREATE POLICY "Users can view group members" ON users
  FOR SELECT USING (
    id IN (
      SELECT gm.user_id FROM group_members gm
      WHERE gm.user_id = auth.uid()::uuid
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = auth_id::text);
```

### Groups Table

```sql
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Users can view groups they're members of
CREATE POLICY "Users can view their groups" ON groups
  FOR SELECT USING (
    id IN (
      SELECT gm.group_id FROM group_members gm
      WHERE gm.user_id = auth.uid()::uuid
    )
  );

-- Users can create groups
CREATE POLICY "Users can create groups" ON groups
  FOR INSERT WITH CHECK (created_by = auth.uid()::uuid);

-- Users can update their own groups
CREATE POLICY "Users can update own groups" ON groups
  FOR UPDATE USING (
    id IN (
      SELECT gm.group_id FROM group_members gm
      WHERE gm.user_id = auth.uid()::uuid
    )
  );
```

### Group Members Table

```sql
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Users can view members of groups they're in
CREATE POLICY "Users can view group members" ON group_members
  FOR SELECT USING (
    group_id IN (
      SELECT gm.group_id FROM group_members gm
      WHERE gm.user_id = auth.uid()::uuid
    )
  );

-- Users can add members to groups they're in
CREATE POLICY "Users can manage group members" ON group_members
  FOR INSERT WITH CHECK (
    group_id IN (
      SELECT gm.group_id FROM group_members gm
      WHERE gm.user_id = auth.uid()::uuid
    )
  );

-- Users can remove themselves from groups
CREATE POLICY "Users can leave groups" ON group_members
  FOR DELETE USING (user_id = auth.uid()::uuid);
```

### Expenses Table

```sql
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Users can view expenses in groups they're members of
CREATE POLICY "Users can view group expenses" ON expenses
  FOR SELECT USING (
    group_id IN (
      SELECT gm.group_id FROM group_members gm
      WHERE gm.user_id = auth.uid()::uuid
    )
  );

-- Users can create expenses in groups they're members of
CREATE POLICY "Users can create expenses" ON expenses
  FOR INSERT WITH CHECK (
    paid_by = auth.uid()::uuid
    AND group_id IN (
      SELECT gm.group_id FROM group_members gm
      WHERE gm.user_id = auth.uid()::uuid
    )
  );

-- Users can update their own expenses
CREATE POLICY "Users can update own expenses" ON expenses
  FOR UPDATE USING (paid_by = auth.uid()::uuid);

-- Users can delete their own expenses
CREATE POLICY "Users can delete own expenses" ON expenses
  FOR DELETE USING (paid_by = auth.uid()::uuid);
```

### Expense Participants Table

```sql
ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;

-- Users can view participants in expenses they can see
CREATE POLICY "Users can view expense participants" ON expense_participants
  FOR SELECT USING (
    expense_id IN (
      SELECT e.id FROM expenses e
      WHERE e.group_id IN (
        SELECT gm.group_id FROM group_members gm
        WHERE gm.user_id = auth.uid()::uuid
      )
    )
  );

-- Users can manage participants for their expenses
CREATE POLICY "Users can manage participants" ON expense_participants
  FOR INSERT WITH CHECK (
    expense_id IN (
      SELECT e.id FROM expenses e
      WHERE e.paid_by = auth.uid()::uuid
    )
  );
```

### Categories & Subcategories

```sql
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Everyone can view categories and subcategories
CREATE POLICY "Everyone can view categories" ON categories
  FOR SELECT USING (TRUE);

CREATE POLICY "Everyone can view subcategories" ON subcategories
  FOR SELECT USING (TRUE);
```

### Expense Suggestions

```sql
ALTER TABLE expense_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can view their own suggestions
CREATE POLICY "Users can view own suggestions" ON expense_suggestions
  FOR SELECT USING (user_id = auth.uid()::uuid);

-- Users can create/update their own suggestions
CREATE POLICY "Users can manage own suggestions" ON expense_suggestions
  FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

CREATE POLICY "Users can update own suggestions" ON expense_suggestions
  FOR UPDATE USING (user_id = auth.uid()::uuid);
```

## Setup Steps

1. Create a new project in Supabase
2. Go to SQL Editor and run all the schema SQL above
3. Enable Google OAuth in Authentication → Providers
4. Set up your redirect URLs in Authentication → URL Configuration
5. Create API keys in Settings → API Keys (copy `anon` and `service_role` keys)
6. Add environment variables to your `.env` files

## Environment Variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
