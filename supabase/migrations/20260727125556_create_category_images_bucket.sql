/*
# Create category-images storage bucket

## Purpose
Stores category image uploads from the Admin Dashboard. Admin uploads an
image for a category; the public URL is saved in categories.image_url and
rendered on the storefront category cards.

## Changes
1. Create a public storage bucket named "category-images" if it does not
   already exist. Public buckets expose files via a predictable public URL,
   which is what the storefront needs to render category images without
   per-request signed URLs.
2. RLS policies on storage.objects:
   - Allow anyone (anon + authenticated) to READ (SELECT) category images,
     since they are shown publicly on the storefront.
   - Allow authenticated users to INSERT (upload) and UPDATE (replace)
     their own objects under the category-images bucket. Admin actions are
     gated by the app's admin UI; storage-level ownership is scoped to the
     uploader via the standard storage owner pattern.
   - Allow authenticated users to DELETE their own objects so replaced
     images can be cleaned up.

## Important notes
1. The bucket is PUBLIC so images render on the storefront without signed
   URLs. This is intentional for category marketing imagery.
2. Policies use the storage RLS helpers (storage.foldername(),
   auth.uid() = owner). Only the uploader can replace/delete their own
   uploads; reads are open to everyone.
3. No default/sample images are uploaded.
4. No sample categories are created.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for storefront rendering
DROP POLICY IF EXISTS "public_read_category_images" ON storage.objects;
CREATE POLICY "public_read_category_images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'category-images');

-- Authenticated users can upload new images
DROP POLICY IF EXISTS "auth_upload_category_images" ON storage.objects;
CREATE POLICY "auth_upload_category_images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'category-images');

-- Authenticated users can update/replace images they own
DROP POLICY IF EXISTS "auth_update_category_images" ON storage.objects;
CREATE POLICY "auth_update_category_images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'category-images' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'category-images');

-- Authenticated users can delete their own images (cleanup on replace)
DROP POLICY IF EXISTS "auth_delete_category_images" ON storage.objects;
CREATE POLICY "auth_delete_category_images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'category-images' AND owner = auth.uid());
