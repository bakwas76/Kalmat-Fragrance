/*
# Fix Google OAuth profile creation and session handling

## Problem
Google OAuth redirects back to the home page but the user is NOT logged in
and no profile is created. Root causes:
1. The handle_new_user() trigger uses a plain INSERT, which crashes with a
   unique-violation if the trigger fires more than once for the same user
   (e.g. OAuth retry, re-auth). A crash inside the trigger aborts the
   auth.users INSERT, so the user is never created — no session, no profile.
2. profiles has no INSERT RLS policy, so even if a session is established,
   the frontend cannot create a profile row as a fallback if the trigger
   missed it.
3. profiles has no email column, so OAuth email metadata has nowhere to go.

## Changes
1. Add `email` column (text) to public.profiles.
2. Rewrite handle_new_user() to use INSERT ... ON CONFLICT DO UPDATE
   (idempotent upsert) so re-firing is safe. It now also captures email
   from NEW.email (auth.users.email) and falls back to metadata.
3. Add INSERT policy "insert_own_profile" on profiles so an authenticated
   user can create their own profile row (fallback path).
4. Re-grant the trigger so it picks up the new function body.

## Security
- profiles RLS now allows: owner SELECT, owner INSERT, owner UPDATE,
  admin SELECT. No DELETE (profiles cascade from auth.users).
- All policies use auth.uid() ownership checks.

## Important notes
1. The upsert trigger is safe to re-run: ON CONFLICT (id) updates
   full_name, avatar_url, email instead of crashing.
2. The first-user-becomes-admin bootstrap only applies on the INSERT path
   (WHERE NOT EXISTS), never on conflict update, so it won't dethrone
   an existing admin.
3. SECURITY DEFINER + SET search_path = public prevents search_path
   injection in the trigger function.
*/

-- 1. Add email column to profiles (additive, no data loss)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text;

-- 2. Idempotent upsert trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_first boolean;
BEGIN
  SELECT count(*) = 0 INTO is_first FROM public.profiles;

  INSERT INTO public.profiles (id, full_name, phone, avatar_url, email, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    NEW.email,
    is_first
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name   = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url  = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    email       = COALESCE(EXCLUDED.email, public.profiles.email),
    phone       = COALESCE(EXCLUDED.phone, public.profiles.phone);

  RETURN NEW;
END;
$$;

-- 3. Add INSERT policy so frontend can create its own profile as a fallback
DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
CREATE POLICY "insert_own_profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 4. Re-bind the trigger to the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
