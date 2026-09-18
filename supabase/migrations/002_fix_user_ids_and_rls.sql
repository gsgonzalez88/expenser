-- Fix 1: users.id must equal auth.users.id so RLS can compare against auth.uid().
-- Fix 2: group_members policies referenced group_members recursively.
-- Fix 3: add RPCs for inviting by email and creating a group atomically.

-- ---------- 1. Unify users.id with auth id ----------
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_auth_id_fkey;
UPDATE users SET id = auth_id;
-- Old policies depend on auth_id and must go before the column does.
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view group members" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
ALTER TABLE users DROP COLUMN auth_id;
ALTER TABLE users
  ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET
    email = NEW.email,
    name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    avatar_url = NEW.raw_user_meta_data->>'avatar_url',
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- Backfill users who signed in before the trigger existed.
INSERT INTO public.users (id, email, name, avatar_url)
SELECT id, email,
       COALESCE(raw_user_meta_data->>'full_name', email),
       raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ---------- 2. Non-recursive membership check ----------
CREATE OR REPLACE FUNCTION public.is_group_member(gid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = gid AND user_id = auth.uid()
  );
$$;

-- users

CREATE POLICY "users_select_self" ON users
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_select_groupmates" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.user_id = users.id AND is_group_member(gm.group_id)
    )
  );
CREATE POLICY "users_update_self" ON users
  FOR UPDATE USING (id = auth.uid());

-- groups
DROP POLICY IF EXISTS "Users can view their groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Users can update own groups" ON groups;

CREATE POLICY "groups_select_member" ON groups
  FOR SELECT USING (is_group_member(id));
CREATE POLICY "groups_insert_own" ON groups
  FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "groups_update_member" ON groups
  FOR UPDATE USING (is_group_member(id));
CREATE POLICY "groups_delete_creator" ON groups
  FOR DELETE USING (created_by = auth.uid());

-- group_members
DROP POLICY IF EXISTS "Users can view group members" ON group_members;
DROP POLICY IF EXISTS "Users can manage group members" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;

CREATE POLICY "group_members_select" ON group_members
  FOR SELECT USING (is_group_member(group_id));
CREATE POLICY "group_members_insert" ON group_members
  FOR INSERT WITH CHECK (is_group_member(group_id));
CREATE POLICY "group_members_delete_self" ON group_members
  FOR DELETE USING (user_id = auth.uid());

-- expenses
DROP POLICY IF EXISTS "Users can view group expenses" ON expenses;
DROP POLICY IF EXISTS "Users can create expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;

CREATE POLICY "expenses_select_member" ON expenses
  FOR SELECT USING (is_group_member(group_id));
CREATE POLICY "expenses_insert_member" ON expenses
  FOR INSERT WITH CHECK (paid_by = auth.uid() AND is_group_member(group_id));
CREATE POLICY "expenses_update_own" ON expenses
  FOR UPDATE USING (paid_by = auth.uid());
CREATE POLICY "expenses_delete_own" ON expenses
  FOR DELETE USING (paid_by = auth.uid());

-- expense_participants
DROP POLICY IF EXISTS "Users can view expense participants" ON expense_participants;
DROP POLICY IF EXISTS "Users can manage participants" ON expense_participants;

CREATE POLICY "expense_participants_select" ON expense_participants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND is_group_member(e.group_id))
  );
CREATE POLICY "expense_participants_insert" ON expense_participants
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND e.paid_by = auth.uid())
  );

-- expense_suggestions
DROP POLICY IF EXISTS "Users can view own suggestions" ON expense_suggestions;
DROP POLICY IF EXISTS "Users can manage own suggestions" ON expense_suggestions;
DROP POLICY IF EXISTS "Users can update own suggestions" ON expense_suggestions;

CREATE POLICY "expense_suggestions_all_own" ON expense_suggestions
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------- 3. RPCs ----------
-- Creates the group and adds the creator as member in one transaction.
CREATE OR REPLACE FUNCTION public.create_group(p_name TEXT, p_description TEXT DEFAULT NULL)
RETURNS groups
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  g groups;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  INSERT INTO groups (name, description, created_by)
  VALUES (p_name, p_description, auth.uid())
  RETURNING * INTO g;
  INSERT INTO group_members (group_id, user_id) VALUES (g.id, auth.uid());
  RETURN g;
END;
$$;

-- Adds an existing user to a group by email. Caller must be a member.
CREATE OR REPLACE FUNCTION public.add_group_member_by_email(p_group_id UUID, p_email TEXT)
RETURNS users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  u users;
BEGIN
  IF NOT is_group_member(p_group_id) THEN
    RAISE EXCEPTION 'Not a member of this group';
  END IF;
  SELECT * INTO u FROM users WHERE lower(email) = lower(p_email);
  IF u.id IS NULL THEN
    RAISE EXCEPTION 'No user found with email %. They need to sign in once first.', p_email;
  END IF;
  INSERT INTO group_members (group_id, user_id) VALUES (p_group_id, u.id)
  ON CONFLICT (group_id, user_id) DO NOTHING;
  RETURN u;
END;
$$;
