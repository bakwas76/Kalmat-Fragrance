/*
# Create announcement_banner settings table

## Purpose
Stores the configurable top announcement banner settings for the
Kalmat Fragrance storefront. A single row (id = 1) holds all
display configuration: text, colors, typography, dimensions,
animation, speed, and alignment. The admin panel reads and writes
this row; the public website reads it to render the banner.

## New Table
- `announcement_banner` (single-row, id is always 1)
  - `enabled` (boolean, default false) — show/hide the banner
  - `text` (text) — the announcement message
  - `bg_color` (text, default '#080808') — background color (hex)
  - `text_color` (text, default '#C9A227') — text color (hex)
  - `font_size` (integer, default 13) — font size in px
  - `font_weight` (text, default 'normal') — normal | medium | bold
  - `height` (integer, default 40) — banner height in px
  - `padding` (integer, default 16) — horizontal padding in px
  - `animation` (text, default 'none') — none|marquee|fade|slide-left|slide-right|slide-up|slide-down|bounce|pulse
  - `speed` (text, default 'normal') — slow | normal | fast
  - `text_align` (text, default 'center') — left | center | right
  - `updated_at` (timestamptz) — last modification time (auto-updated via trigger)

## Security
- RLS enabled on `announcement_banner`.
- SELECT: public (anon, authenticated) — the storefront must read
  banner settings without a sign-in session.
- INSERT / UPDATE / DELETE: admin only (is_admin() check).
- A default row is inserted with the banner disabled.

## Trigger
- `announcement_banner_updated_at` auto-updates `updated_at` on
  every UPDATE.
*/

CREATE TABLE IF NOT EXISTS announcement_banner (
  id integer PRIMARY KEY DEFAULT 1,
  enabled boolean NOT NULL DEFAULT false,
  text text NOT NULL DEFAULT '',
  bg_color text NOT NULL DEFAULT '#080808',
  text_color text NOT NULL DEFAULT '#C9A227',
  font_size integer NOT NULL DEFAULT 13,
  font_weight text NOT NULL DEFAULT 'normal' CHECK (font_weight IN ('normal', 'medium', 'bold')),
  height integer NOT NULL DEFAULT 40,
  padding integer NOT NULL DEFAULT 16,
  animation text NOT NULL DEFAULT 'none' CHECK (animation IN ('none', 'marquee', 'fade', 'slide-left', 'slide-right', 'slide-up', 'slide-down', 'bounce', 'pulse')),
  speed text NOT NULL DEFAULT 'normal' CHECK (speed IN ('slow', 'normal', 'fast')),
  text_align text NOT NULL DEFAULT 'center' CHECK (text_align IN ('left', 'center', 'right')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE announcement_banner ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_announcement_banner" ON announcement_banner;
CREATE POLICY "public_read_announcement_banner"
ON announcement_banner FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "admin_insert_announcement_banner" ON announcement_banner;
CREATE POLICY "admin_insert_announcement_banner"
ON announcement_banner FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_announcement_banner" ON announcement_banner;
CREATE POLICY "admin_update_announcement_banner"
ON announcement_banner FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_announcement_banner" ON announcement_banner;
CREATE POLICY "admin_delete_announcement_banner"
ON announcement_banner FOR DELETE
TO authenticated
USING (is_admin());

INSERT INTO announcement_banner (id, text)
VALUES (1, 'Complimentary shipping on orders over Rs 5,000 — Discover the new Royal Oud collection')
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION update_announcement_banner_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS announcement_banner_updated_at ON announcement_banner;
CREATE TRIGGER announcement_banner_updated_at
BEFORE UPDATE ON announcement_banner
FOR EACH ROW
EXECUTE FUNCTION update_announcement_banner_timestamp();
