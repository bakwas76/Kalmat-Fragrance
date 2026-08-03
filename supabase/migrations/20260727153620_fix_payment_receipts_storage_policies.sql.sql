/*
# Fix payment-receipts storage bucket RLS policies

## Problem
The `payment-receipts` storage bucket had INSERT, UPDATE, and DELETE
policies but was missing a SELECT policy, meaning no one could read
receipts through the Supabase Storage API. Additionally, the frontend
upload used `upsert: true`, which compiles to `INSERT ... ON CONFLICT
DO UPDATE`. PostgreSQL requires an applicable UPDATE policy for the
upsert's UPDATE path to be authorized — even when no conflict occurs.
Guest checkouts upload as the `anon` role, which had no UPDATE policy,
so every upsert upload failed with "new row violates row-level
security policy."

## Fix
1. The frontend `upsert: true` flag is removed (filenames are unique
   via timestamp, so upsert is unnecessary). This is applied in code.
2. This migration adds a SELECT policy so authenticated users can read
   their own uploaded receipts and admins can read all receipts in the
   `payment-receipts` bucket.
3. Existing INSERT / UPDATE / DELETE policies are left unchanged.

## Security
- SELECT: authenticated users read only objects they own
  (`owner = auth.uid()`); admins (`is_admin()`) can read all objects
  in the bucket.
- INSERT: remains open to `anon, authenticated` so guest checkout
  (no sign-in) can still upload manual-payment receipts.
- UPDATE / DELETE: remain restricted to the authenticated owner.
- RLS stays enabled on `storage.objects` — not disabled.
*/

-- SELECT policy: authenticated owners can read their receipts; admins can read all
DROP POLICY IF EXISTS "auth_read_payment_receipts" ON storage.objects;
CREATE POLICY "auth_read_payment_receipts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-receipts'
  AND (owner = auth.uid() OR is_admin())
);
