/*
# Create Hero Slider system

## Summary
Adds a premium, fully admin-managed hero image slider for the storefront homepage,
inspired by luxury fragrance brands (Dior, Tom Ford, Chanel, Byredo). Two new
tables plus a dedicated storage bucket for slide imagery. No existing tables,
columns, routes, or business logic are touched — this is purely additive.

## 1. New Tables

### hero_slides
One row per slide shown in the homepage hero carousel.
- id (uuid, PK)
- desktop_image_url (text, not null) — full-bleed hero image for desktop/tablet
- mobile_image_url (text, nullable) — optional portrait/mobile image; falls back to desktop crop
- tag (text, nullable) — small eyebrow label above the title (e.g. "New Arrival")
- title (text, not null) — large headline
- subtitle (text, nullable) — supporting line under the title
- button_text (text, nullable) — CTA label
- button_url (text, nullable) — CTA destination (internal path or external URL)
- text_position (enum: left | center | right, default left) — horizontal alignment of the text block
- overlay_opacity (int 0–100, default 40) — dark overlay percentage behind text for legibility
- sort_order (int, default 0) — lower numbers appear first; drag-and-drop reorders this
- enabled (bool, default true) — disabled slides are hidden from the storefront
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

### hero_slider_settings
A single settings row (id = 1) controlling global slider behaviour.
- id (int, PK, always 1)
- autoplay (bool, default true) — auto-rotate between slides
- interval_seconds (int, default 6) — seconds between auto advances
- transition_duration_ms (int, default 900) — crossfade/zoom transition length
- animation_type (enum: fade | fade-zoom | crossfade, default fade-zoom)
- pause_on_hover (bool, default true)
- infinite_loop (bool, default true)
- show_arrows (bool, default true) — navigation arrows on desktop
- show_dots (bool, default true) — pagination dots
- swipe_enabled (bool, default true) — touch swipe on mobile
- updated_at (timestamptz, default now())

## 2. Storage
- New private-asset bucket "hero-images" for desktop + mobile slide uploads.
- Public read allowed; only admins can upload/update/delete.

## 3. Security (RLS)
Both tables follow the existing storefront convention:
- Public SELECT (TO anon, authenticated) so anonymous storefront visitors see slides + settings.
- Admin-only INSERT / UPDATE / DELETE guarded by the existing is_admin() helper.
- Storage: public read of hero-images objects; admin-only write/delete.

## 4. Notes
- Idempotent: CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS before each CREATE POLICY.
- is_admin() already exists in the database (created in the initial schema migration).
- No foreign keys to other tables; hero slider is self-contained.
- Default settings row (id=1) is seeded so the storefront has config to read immediately.
*/

-- ---------------------------------------------------------------------------
-- hero_slides
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  desktop_image_url text NOT NULL,
  mobile_image_url text,
  tag text,
  title text NOT NULL,
  subtitle text,
  button_text text,
  button_url text,
  text_position text NOT NULL DEFAULT 'left' CHECK (text_position IN ('left','center','right')),
  overlay_opacity int NOT NULL DEFAULT 40 CHECK (overlay_opacity >= 0 AND overlay_opacity <= 100),
  sort_order int NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_hero_slides" ON public.hero_slides;
CREATE POLICY "public_read_hero_slides"
  ON public.hero_slides FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_hero_slides" ON public.hero_slides;
CREATE POLICY "admin_insert_hero_slides"
  ON public.hero_slides FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_hero_slides" ON public.hero_slides;
CREATE POLICY "admin_update_hero_slides"
  ON public.hero_slides FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_hero_slides" ON public.hero_slides;
CREATE POLICY "admin_delete_hero_slides"
  ON public.hero_slides FOR DELETE
  TO authenticated USING (is_admin());

-- ---------------------------------------------------------------------------
-- hero_slider_settings (single row, id = 1)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hero_slider_settings (
  id int PRIMARY KEY DEFAULT 1,
  autoplay boolean NOT NULL DEFAULT true,
  interval_seconds int NOT NULL DEFAULT 6 CHECK (interval_seconds >= 1 AND interval_seconds <= 60),
  transition_duration_ms int NOT NULL DEFAULT 900 CHECK (transition_duration_ms >= 100 AND transition_duration_ms <= 5000),
  animation_type text NOT NULL DEFAULT 'fade-zoom' CHECK (animation_type IN ('fade','fade-zoom','crossfade')),
  pause_on_hover boolean NOT NULL DEFAULT true,
  infinite_loop boolean NOT NULL DEFAULT true,
  show_arrows boolean NOT NULL DEFAULT true,
  show_dots boolean NOT NULL DEFAULT true,
  swipe_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hero_slider_settings_singleton CHECK (id = 1)
);

ALTER TABLE public.hero_slider_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_hero_slider_settings" ON public.hero_slider_settings;
CREATE POLICY "public_read_hero_slider_settings"
  ON public.hero_slider_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_hero_slider_settings" ON public.hero_slider_settings;
CREATE POLICY "admin_update_hero_slider_settings"
  ON public.hero_slider_settings FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_insert_hero_slider_settings" ON public.hero_slider_settings;
CREATE POLICY "admin_insert_hero_slider_settings"
  ON public.hero_slider_settings FOR INSERT
  TO authenticated WITH CHECK (is_admin());

-- Seed default settings row if absent
INSERT INTO public.hero_slider_settings (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Storage bucket: hero-images
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-images', 'hero-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
DROP POLICY IF EXISTS "public_read_hero_images" ON storage.objects;
CREATE POLICY "public_read_hero_images"
  ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'hero-images');

-- Admin upload/update
DROP POLICY IF EXISTS "admin_upload_hero_images" ON storage.objects;
CREATE POLICY "admin_upload_hero_images"
  ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'hero-images' AND is_admin());

DROP POLICY IF EXISTS "admin_update_hero_images" ON storage.objects;
CREATE POLICY "admin_update_hero_images"
  ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'hero-images' AND is_admin());

-- Admin delete
DROP POLICY IF EXISTS "admin_delete_hero_images" ON storage.objects;
CREATE POLICY "admin_delete_hero_images"
  ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'hero-images' AND is_admin());
