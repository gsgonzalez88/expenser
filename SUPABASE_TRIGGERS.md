# Supabase Triggers for Auto-sync

After setting up Google OAuth, add this SQL to automatically create user records when people sign up.

## Create User on Auth Signup

Add this trigger to auto-create a user record in the `users` table whenever someone signs up via Google OAuth.

```sql
-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (auth_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = CURRENT_TIMESTAMP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## Update User on Auth Update

```sql
-- Update user when auth record changes
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET
    email = NEW.email,
    name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    avatar_url = NEW.raw_user_meta_data->>'avatar_url',
    updated_at = CURRENT_TIMESTAMP
  WHERE auth_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users update
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_update();
```

## Test the Trigger

1. Go to Supabase SQL Editor
2. Copy and paste the trigger code above
3. Run it

Now when a user signs up via Google OAuth:
- A record is automatically created in the `users` table
- Fields: `auth_id`, `email`, `name`, `avatar_url`

## Verify It Works

1. Sign up with Google in your app
2. Go to Supabase → Table Editor → `users`
3. You should see your record there automatically!

If it doesn't work, check:
- Trigger was created (look in Functions & Triggers)
- RLS policies allow the trigger to insert (use `SECURITY DEFINER`)
- Check logs in Supabase for errors
