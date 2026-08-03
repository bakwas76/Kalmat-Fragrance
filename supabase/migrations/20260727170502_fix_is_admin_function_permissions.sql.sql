/*
# Fix: is_admin() not executable by authenticated/anon roles

## Problem
The `is_admin()` function is used in RLS policies on `profiles`
(and many other tables):

    -- profiles.select_own_profile
    ((auth.uid() = id) OR is_admin())

But EXECUTE on `is_admin()` was only granted to `service_role` and
`postgres` — NOT to `authenticated` or `anon`. When the frontend
(an anon-key client acting as an `authenticated` user) runs
`SELECT * FROM profiles WHERE id = <uid>`, Postgres evaluates the
RLS policy, calls `is_admin()`, and hits:

    ERROR: permission denied for function is_admin

That error aborts the entire profile query, so `loadProfile()`
returns `null`. The app then sees `isAdmin = false` and hides the
Admin Dashboard — even though the database row has
`is_admin = true`.

## Fix
1. Recreate `is_admin()` as SECURITY INVOKER (not DEFINER).
   SECURITY DEFINER + RLS on the same table causes infinite
   recursion: the DEFINER role bypasses RLS, re-enters the policy,
   calls is_admin() again, forever. With INVOKER, the caller's own
   RLS applies — and because `select_own_profile` lets a user read
   their own row, the EXISTS subquery resolves against that row
   without recursing.
2. Grant EXECUTE to `authenticated` and `anon` so the RLS policies
   can actually call the function.

## Why this is safe
- A user can always see their own profile row (select_own_profile:
  auth.uid() = id), so the EXISTS check has access to that row.
- SECURITY INVOKER means no privilege escalation: the function
  only sees what the caller can see.
- Other admin policies (on products, orders, etc.) call is_admin()
  to gate admin writes; with the grant in place, an admin user
  (who can read their own is_admin=true row) gets true, everyone
  else gets false.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$;

-- Grant execute to the roles that hit it via RLS policies.
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
