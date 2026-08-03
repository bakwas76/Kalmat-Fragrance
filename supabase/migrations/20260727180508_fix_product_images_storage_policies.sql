/*
# Fix product-images storage bucket RLS policies

## Problem
Product image uploads failed with "new row violates row-level security policy".
Root causes:
  - The UPDATE policy required `owner = auth.uid()`. The upload code uses
    `upsert: true`, which runs `INSERT ... ON CONFLICT DO UPDATE`. When a
    conflict occurs (same filename), the UPDATE path checks the existing row's
    owner against auth.uid(); if they differ the check fails and Postgres
    raises "new row violates row-level security policy".
  - The INSERT policy allowed ANY authenticated user to upload — not just
    admins — which violates the security requirement.
  - There was no public SELECT policy on the product-images bucket, so
    storefront image loading via authenticated requests could fail.

## Changes
1. Drop the three existing product-images storage policies
   (auth_upload_product_images, auth_update_product_images,
   auth_delete_product_images).
2. Create four new policies scoped with is_admin():
   - public_read_product_images  (SELECT, public — storefront display)
   - admin_upload_product_images  (INSERT, admin only)
   - admin_update_product_images  (UPDATE, admin only — removes owner check)
   - admin_delete_product_images  (DELETE, admin only — removes owner check)
3. RLS on storage.objects remains enabled — it is NOT disabled globally.

## Security
- Write operations (INSERT / UPDATE / DELETE) are restricted to authenticated
  admin users via the existing is_admin() function.
- Read access (SELECT) is public (anon + authenticated) so product images
  display correctly on the storefront for all visitors.
- The is_admin() function reads public.profiles with the caller's privileges;
  the profiles SELECT policy allows a user to read their own row, so the
  is_admin() check works correctly inside storage policies.
*/

-- Remove the broken policies that caused the upload failure.
DROP POLICY IF EXISTS "auth_upload_product_images" ON storage.objects;
DROP POLICY IF EXISTS "auth_update_product_images" ON storage.objects;
DROP POLICY IF EXISTS "auth_delete_product_images" ON storage.objects;

-- Public read: anyone (anon + authenticated) can view product images so the
-- storefront displays them correctly for all visitors.
CREATE POLICY "public_read_product_images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

-- Admin-only upload. Replaces the old policy that allowed any authenticated
-- user to upload. is_admin() checks public.profiles.is_admin for the caller.
CREATE POLICY "admin_upload_product_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND is_admin());

-- Admin-only update. Removes the old `owner = auth.uid()` check that broke
-- image replacement (upsert ON CONFLICT path). Any admin can now replace any
-- product image, which matches the admin-panel workflow.
CREATE POLICY "admin_update_product_images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND is_admin())
WITH CHECK (bucket_id = 'product-images' AND is_admin());

-- Admin-only delete. Removes the old `owner = auth.uid()` check so any admin
-- can remove product images.
CREATE POLICY "admin_delete_product_images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND is_admin());