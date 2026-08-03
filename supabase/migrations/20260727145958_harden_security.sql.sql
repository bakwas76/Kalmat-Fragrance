/*
# Harden security: search_path, RPC grants, RLS checks, storage listing

## Purpose
Address multiple security advisories flagged by the Supabase security linter:
mutable search_path on SECURITY DEFINER functions, public execute on
SECURITY DEFINER functions that are not meant to be called directly,
INSERT policies that allow unrestricted rows, and public storage buckets
whose SELECT policy lets any client list every file in the bucket.

## Changes

### 1. Function search_path (mutable -> fixed)
- is_admin(), increment_coupon_usage(), track_order() had no explicit
  search_path, so a role with ALTER permission could shadow the public
  schema. All three are recreated with `SET search_path = public`.
  (handle_new_user() already had SET search_path = public from a prior
  migration and is not touched here.)

### 2. Revoke public execute on functions not called from the client
- handle_new_user(): a trigger, never invoked via RPC. Revoke from
  PUBLIC/anon/authenticated.
- is_admin(): used internally by RLS policies, not called via RPC by
  the frontend (the frontend reads profiles.is_admin directly). Revoke
  from PUBLIC/anon/authenticated.
- increment_coupon_usage(): called only from the place-order edge
  function using the service-role key, not from the browser. Revoke
  from PUBLIC/anon/authenticated.
- track_order(): called directly from the Track Order page by guests,
  so it STAYS executable by anon + authenticated (intentional public
  lookup gated by order number + email). Only the search_path is fixed.

### 3. INSERT policy WITH CHECK tightening (not blanket true)
These three policies are public-by-design (guest checkout, public contact
form, public newsletter signup) so the anon role must still be allowed to
INSERT. The fix is to replace `WITH CHECK (true)` with a predicate that
validates the required fields are present, so a client cannot insert
arbitrary malformed/empty rows.
- orders (anyone_insert_orders): require order_number, customer_name,
  email, phone, a non-empty items array, and a non-negative total.
- newsletter_subscribers (public_insert_newsletter): require a non-empty
  email (the unique constraint already prevents duplicates).
- contact_messages (public_insert_messages): require name, email,
  subject, and message to be non-empty.

### 4. Storage bucket SELECT policies (prevent full bucket listing)
Public buckets serve object URLs directly; a broad SELECT policy on
storage.objects lets any client list ALL files in the bucket, exposing
more than intended. Replace the bucket-wide SELECT policies with policies
scoped to the expected object path prefix so listing is only allowed where
the app legitimately needs it. Direct object reads via public URL still
work (public bucket) — only the LIST API is affected.
- category-images: allow listing only under "" (root) is still broad, so
  instead we DROP the broad SELECT and rely on the public bucket for
  direct object reads. Admin uploads remain via INSERT policies.
- payment-receipts: same — drop broad SELECT; direct object URL reads
  still work since the bucket is public.
- product-images: same.
Rationale: for public buckets, Supabase serves each object via its public
URL without needing a storage.objects SELECT policy at all. The SELECT
policy only governs the LIST API. Removing it stops clients from
enumerating every file while keeping image rendering working everywhere
the app uses public URLs.

## Important notes
1. No tables, columns, or data are dropped or renamed.
2. track_order remains callable by anon + authenticated (intentional).
3. Edge-function calls to increment_coupon_usage continue to work because
   the edge function uses the service-role key, which bypasses GRANT
   checks (service role is the function owner's privileged context).
4. Public bucket images still render via their public URLs in the
   storefront and admin panel — only the LIST API is restricted.
5. Idempotent: policies are dropped before re-creation; functions use
   CREATE OR REPLACE; grants use REVOKE ... GRANT.
*/

-- ===========================================================================
-- 1. Fix mutable search_path on SECURITY DEFINER functions
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$;

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(code_input text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE code = upper(code_input)
    AND active = true
    AND (usage_limit IS NULL OR used_count < usage_limit);
END;
$$;

CREATE OR REPLACE FUNCTION public.track_order(order_num text, email_input text)
RETURNS public.orders
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT * FROM public.orders
  WHERE order_number = upper(order_num)
    AND lower(email) = lower(email_input)
  LIMIT 1;
$$;

-- ===========================================================================
-- 2. Revoke public execute on functions NOT meant to be called via RPC
-- ===========================================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.increment_coupon_usage(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_coupon_usage(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_coupon_usage(text) FROM authenticated;

-- track_order stays callable by anon + authenticated (intentional public lookup)
REVOKE ALL ON FUNCTION public.track_order(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_order(text, text) TO anon, authenticated;

-- ===========================================================================
-- 3. Tighten INSERT policy WITH CHECK clauses (no more blanket true)
-- ===========================================================================

-- orders: guest checkout must remain, but validate required fields
DROP POLICY IF EXISTS "anyone_insert_orders" ON public.orders;
CREATE POLICY "anyone_insert_orders" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    order_number IS NOT NULL AND length(btrim(order_number)) > 0
    AND customer_name IS NOT NULL AND length(btrim(customer_name)) > 0
    AND email IS NOT NULL AND length(btrim(email)) > 0
    AND phone IS NOT NULL AND length(btrim(phone)) > 0
    AND items IS NOT NULL AND jsonb_array_length(items) > 0
    AND total IS NOT NULL AND total >= 0
  );

-- newsletter_subscribers: public signup, but require a non-empty email
DROP POLICY IF EXISTS "public_insert_newsletter" ON public.newsletter_subscribers;
CREATE POLICY "public_insert_newsletter" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (email IS NOT NULL AND length(btrim(email)) > 0);

-- contact_messages: public contact form, but require core fields
DROP POLICY IF EXISTS "public_insert_messages" ON public.contact_messages;
CREATE POLICY "public_insert_messages" ON public.contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    name IS NOT NULL AND length(btrim(name)) > 0
    AND email IS NOT NULL AND length(btrim(email)) > 0
    AND subject IS NOT NULL AND length(btrim(subject)) > 0
    AND message IS NOT NULL AND length(btrim(message)) > 0
  );

-- ===========================================================================
-- 4. Restrict storage bucket listing (public buckets serve URLs directly)
-- ===========================================================================

-- category-images: drop broad SELECT so LIST API can't enumerate the bucket
DROP POLICY IF EXISTS "public_read_category_images" ON storage.objects;

-- payment-receipts: drop broad SELECT so LIST API can't enumerate receipts
DROP POLICY IF EXISTS "public_read_payment_receipts" ON storage.objects;

-- product-images: drop broad SELECT so LIST API can't enumerate the bucket
DROP POLICY IF EXISTS "public_read_product_images" ON storage.objects;
