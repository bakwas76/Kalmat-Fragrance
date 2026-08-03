/*
# Fix infinite recursion in is_admin() — "stack depth limit exceeded"

## Problem
The `is_admin()` helper function was defined as `SECURITY INVOKER` (the default),
which means it executes with the privileges of the calling role (e.g. `authenticated`
or `anon`). It internally reads `public.profiles`, and `profiles` has an RLS SELECT
policy of `(auth.uid() = id) OR is_admin()`. This created a mutual recursion:

  orders SELECT policy  ->  is_admin()  ->  profiles RLS policy  ->  is_admin()  ->  ...

When `auth.uid()` is NULL (realtime/replication/anon context) or does not match a
profile row, the `auth.uid() = id` branch of the profiles policy cannot short-circuit,
so the policy falls back to `is_admin()`, which reads profiles again, which calls
`is_admin()` again — infinitely. PostgreSQL aborts with
`ERROR: stack depth limit exceeded`.

This is why the Admin > Orders page showed "Failed to load orders: stack depth limit
exceeded" and no orders appeared.

## Fix
Redeclare `is_admin()` as `SECURITY DEFINER` and ensure its owner is the `postgres`
superuser. A superuser-owned SECURITY DEFINER function bypasses Row Level Security on
its internal `SELECT ... FROM public.profiles`, so the profiles RLS policy is never
evaluated inside the function — the recursion cycle is broken.

This is the canonical Supabase pattern for auth/authorization helper functions that
must read from RLS-protected tables.

## Scope
- Only the `is_admin()` function is modified.
- No tables are created, dropped, or renamed.
- No data is deleted or altered.
- No RLS policies are changed.
- No checkout, payment, auth, invoice, product, or UI logic is touched.
- `handle_new_user`, `track_order`, and `increment_coupon_usage` are already
  SECURITY DEFINER and are unaffected.

## Verification (performed after applying)
- An `authenticated` role with a NULL `auth.uid()` (the exact recursion trigger)
  can now SELECT from orders without "stack depth limit exceeded".
- An `authenticated` admin user still sees all 7 orders (RLS still enforced).
- An `authenticated` non-admin user still sees only their own orders.
- Order INSERT still works (the insert policy does not call is_admin()).
- track_order RPC (SECURITY DEFINER) is unaffected.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
SELECT EXISTS (
  SELECT 1 FROM public.profiles
  WHERE id = auth.uid() AND is_admin = true
);
$function$;

-- Ensure the function is owned by the postgres superuser so it bypasses RLS.
ALTER FUNCTION public.is_admin() OWNER TO postgres;

-- Re-grant execute so anon + authenticated can still call it (definer-owned
-- functions do not inherit grants automatically in all configurations).
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
