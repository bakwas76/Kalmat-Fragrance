/*
# Add product image support

## Purpose
Adds an image_url column to the products table so each product can have
an uploaded image stored in Supabase Storage. Also creates a public
"product-images" storage bucket for those uploads.

## Changes
1. Add `image_url` (text, nullable) column to public.products. This stores
   the public URL of the uploaded product image.
2. Create a public storage bucket named "product-images".
3. RLS policies on storage.objects for the product-images bucket:
   - Public read (anon + authenticated) so storefront can render images.
   - Authenticated insert (upload) and owner-scoped update/delete.

## Important notes
1. The image_url column is additive and nullable — existing product rows
   are unaffected. Products without an image render a placeholder on the
   storefront.
2. The bucket is PUBLIC so images render on the storefront without signed
   URLs. This is intentional for product marketing imagery.
3. No default images and no sample products are created.
*/

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_product_images" ON storage.objects;
CREATE POLICY "public_read_product_images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "auth_upload_product_images" ON storage.objects;
CREATE POLICY "auth_upload_product_images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "auth_update_product_images" ON storage.objects;
CREATE POLICY "auth_update_product_images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "auth_delete_product_images" ON storage.objects;
CREATE POLICY "auth_delete_product_images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND owner = auth.uid());
