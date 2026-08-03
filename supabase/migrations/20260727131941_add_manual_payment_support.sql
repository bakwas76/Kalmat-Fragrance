/*
# Add manual payment support for orders

## Purpose
Replaces the card (Stripe) payment option with a manual payment system for
Pakistan. Customers pay via JazzCash, Easypaisa, or Bank Transfer outside
the website, then upload a screenshot of their payment receipt. The receipt
image URL and selected payment method are saved with the order. Admins can
then verify or reject the payment.

## Changes
1. Add `payment_receipt_url` (text, nullable) column to public.orders.
   Stores the public URL of the uploaded payment receipt image.
2. Create a public storage bucket named "payment-receipts" for receipt
   image uploads from the checkout page.
3. RLS policies on storage.objects for the payment-receipts bucket:
   - Public read (anon + authenticated) so admins can view receipts.
   - Authenticated insert (upload) — customers upload during checkout.
   - Owner-scoped update/delete for cleanup.

## Important notes
1. The payment_receipt_url column is additive and nullable — existing
   orders are unaffected.
2. The bucket is PUBLIC so admin panel can render receipt images without
   signed URLs.
3. payment_status values used by the app: 'pending_verification' (new
   manual-payment orders), 'verified', 'rejected'. The existing 'pending'
   and 'paid' values remain valid for legacy COD orders — no data is lost.
4. No existing column types are changed; no data is dropped.
*/

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_receipt_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_payment_receipts" ON storage.objects;
CREATE POLICY "public_read_payment_receipts" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'payment-receipts');

DROP POLICY IF EXISTS "auth_upload_payment_receipts" ON storage.objects;
CREATE POLICY "auth_upload_payment_receipts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-receipts');

DROP POLICY IF EXISTS "auth_update_payment_receipts" ON storage.objects;
CREATE POLICY "auth_update_payment_receipts" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'payment-receipts' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'payment-receipts');

DROP POLICY IF EXISTS "auth_delete_payment_receipts" ON storage.objects;
CREATE POLICY "auth_delete_payment_receipts" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'payment-receipts' AND owner = auth.uid());
