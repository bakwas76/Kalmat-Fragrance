/*
# Create Hero Banner singleton table

## Summary
Replaces the multi-slide hero slider system with a single, premium full-width
hero banner. Only one banner image (plus an optional mobile variant) is shown
on the homepage — no slides, no autoplay, no text content, no buttons.

This migration is purely additive: a new `hero_banner` table is created. The
existing `hero_slides` and `hero_slider_settings` tables are left untouched
(non-destructive) but will no longer be referenced by the storefront or admin.

## 1. New Table: hero_banner
A singleton table (always exactly one row, id = 1) holding the hero banner config.
- id (int, PK, always 1) — enforced by a CHECK constraint
- desktop_image_url (text, nullable) — full-width hero image for desktop/tablet.
    When NULL, the homepage renders a clean text-free dark hero section.
- mobile_image_url (text, nullable) — optional portrait image for mobile.
    When NULL, the desktop image is used on mobile.
- overlay_opacity (int 0–100, default 40) — dark overlay percentage over the
    image for the existing luxury dark-overlay look.
- banner_height (int 40–100, default 90) — hero height as a percentage of the
    viewport height (vh). Admin-tunable.
- updated_at (timestamptz, default now())

## 2. Security (RLS)
Follows the existing storefront convention used by hero_slides:
- Public SELECT (TO anon, authenticated) so anonymous visitors see the banner.
- Admin-only INSERT / UPDATE guarded by the existing is_admin() helper.
- No DELETE policy — the singleton row is never removed.

## 3. Seed
A default singleton row (id = 1) is seeded with NULL images so the storefront
has a row to read immediately; it renders the clean fallback layout until an
admin uploads an image.

## 4. Notes
- Idempotent: CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS before CREATE.
- is_admin() already exists in the database.
- The hero-images storage bucket already exists and is reused for uploads.
*/

CREATE TABLE IF NOT EXISTS public.hero_banner (
  id int PRIMARY KEY DEFAULT 1,
  desktop_image_url text,
  mobile_image_url text,
  overlay_opacity int NOT NULL DEFAULT 40 CHECK (overlay_opacity >= 0 AND overlay_opacity <= 100),
  banner_height int NOT NULL DEFAULT 90 CHECK (banner_height >= 40 AND banner_height <= 100),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hero_banner_singleton CHECK (id = 1)
);

ALTER TABLE public.hero_banner ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_hero_banner" ON public.hero_banner;
CREATE POLICY "public_read_hero_banner"
  ON public.hero_banner FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_hero_banner" ON public.hero_banner;
CREATE POLICY "admin_insert_hero_banner"
  ON public.hero_banner FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_hero_banner" ON public.hero_banner;
CREATE POLICY "admin_update_hero_banner"
  ON public.hero_banner FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Seed the singleton row if absent
INSERT INTO public.hero_banner (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;
