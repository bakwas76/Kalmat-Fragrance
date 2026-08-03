/*
# Allow guest (anon) uploads to payment-receipts bucket

## Purpose
Checkout supports guest orders (no sign-in required). The receipt-upload
storage policy, however, was scoped to `authenticated` only, so an
unauthenticated customer selecting Manual Payment could not upload their
receipt image — the upload failed with a storage permission error before
the order was ever created. This widens the INSERT policy so anon-key
clients (guests) can upload receipts, matching the existing public-read
SELECT policy.

## Changes
1. Replace the `auth_upload_payment_receipts` INSERT policy on
   storage.objects so it grants insert to `anon, authenticated` for the
   `payment-receipts` bucket. Public read remains in place for admins.
   Owner-scoped UPDATE/DELETE policies are left unchanged.

## Important notes
1. Only the INSERT policy is widened; reads stay public (already the case),
   and update/delete remain owner-scoped to authenticated users.
2. The bucket is already public, so receipt images are viewable by admins
   without signed URLs.
3. Idempotent: the policy is dropped before re-creation.
*/

DROP POLICY IF EXISTS "auth_upload_payment_receipts" ON storage.objects;
DROP POLICY IF EXISTS "anon_upload_payment_receipts" ON storage.objects;

CREATE POLICY "anon_upload_payment_receipts" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'payment-receipts');
