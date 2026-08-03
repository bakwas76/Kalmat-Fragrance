/*
# Make handle_new_user recreate missing profiles on UPDATE

## Problem
The `handle_new_user()` trigger fires only `AFTER INSERT` on
`auth.users`. If a profile row is ever deleted (manually or by a
bug), the trigger never re-fires for that user because there is no
new INSERT — they only sign in again, which is an UPDATE to
`auth.users.last_sign_in_at`. The result: the user can sign in but
has no profile row, so the frontend sees `isAdmin = false` and
hides the admin menu, and `is_admin()` returns false for them.

## Fix
Add a second trigger `recreate_missing_profile_on_login` that fires
`AFTER UPDATE` on `auth.users` (only when `last_sign_in_at`
changed). It inserts the profile row if it is missing, using the
same column logic as `handle_new_user`. This is idempotent and
safe to re-run.

## Security
- Function is SECURITY DEFINER, search_path pinned to `public`.
- The `is_first` admin bootstrap runs only on the INSERT path (new
  genuine user), never on the recreate path, so it cannot dethrone
  an existing admin or promote a random user.
- Existing profiles are never overwritten — missing ones only.
*/

CREATE OR REPLACE FUNCTION public.recreate_missing_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when last_sign_in_at changed (i.e. a real sign-in).
  IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at THEN
    INSERT INTO public.profiles (id, full_name, phone, avatar_url, email, is_admin)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      NEW.raw_user_meta_data->>'phone',
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
      NEW.email,
      FALSE
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recreate_missing_profile_on_login ON auth.users;
CREATE TRIGGER recreate_missing_profile_on_login
AFTER UPDATE OF last_sign_in_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.recreate_missing_profile();
