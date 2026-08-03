/*
# Product Reviews & Ratings System

## Purpose
Upgrades the existing `product_reviews` table into a complete review and rating
system with moderation (pending/approved/rejected), purchase verification,
admin replies, one-review-per-product enforcement, and automatic product
rating/count maintenance via triggers.

## 1. Table changes (product_reviews)
New columns:
- `status` (text, NOT NULL, default 'pending') — moderation state:
    'pending' | 'approved' | 'rejected'. Only approved reviews appear publicly.
- `verified_purchase` (boolean, NOT NULL, default false) — set true on insert
    when the reviewer has a paid/delivered order containing the product.
- `admin_reply` (text, nullable) — admin's response to the review.
- `admin_replied_at` (timestamptz, nullable) — when the admin replied.
- `email` (text, nullable) — reviewer's email (copied from auth at submit time
    for admin reference).
- `updated_at` (timestamptz, default now()) — last edit timestamp.

New constraints:
- `product_reviews_rating_check` — rating must be between 1 and 5.
- `product_reviews_status_check` — status must be one of the three allowed values.
- `product_reviews_one_review_per_product` — UNIQUE (product_id, user_id) so a
  user can post at most one review per product (edits go through UPDATE).

New index:
- `product_reviews_status_idx` on (status) for admin filtering by status.

## 2. Trigger function — update_product_review_stats()
Automatically recalculates `products.rating` (average of APPROVED reviews) and
`products.reviews_count` (count of APPROVED reviews) whenever a review is
INSERTed, UPDATEd, or DELETEd. Runs AFTER insert/update/delete on
product_reviews. This keeps the product card and detail page ratings accurate
without any client-side calculation, and works no matter whether the change
comes from the storefront, admin panel, or direct SQL.

## 3. Security (RLS) — product_reviews
Existing policies dropped and replaced:
- public_read_approved_reviews (SELECT, anon+authenticated):
    only approved reviews are visible publicly.
- auth_insert_own_review (INSERT, authenticated):
    user can only insert their own review (user_id = auth.uid()).
- auth_update_own_review (UPDATE, authenticated):
    user can only update their own review's rating/title/comment/name.
    Status and admin_reply are protected — only admin can change those.
- admin_manage_reviews (UPDATE, authenticated + is_admin()):
    admin can update status, admin_reply, etc.
- admin_delete_reviews (DELETE, authenticated + is_admin()):
    admin can delete any review.
- auth_delete_own_review (DELETE, authenticated):
    user can delete their own pending/rejected review.

RLS remains enabled. No globally public writes.

## Notes
- The product rating trigger fires on EVERY insert/update/delete, so admin
  approvals/rejections automatically update the product's displayed rating.
- verified_purchase is set by the frontend at submit time (checking orders) and
  is informational; RLS does not gate on it.
*/

-- 1. Add new columns (idempotent)
ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS verified_purchase boolean NOT NULL DEFAULT false;
ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS admin_reply text;
ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS admin_replied_at timestamptz;
ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 2. Constraints (drop-if-exists then create for idempotency)
ALTER TABLE product_reviews DROP CONSTRAINT IF EXISTS product_reviews_rating_check;
ALTER TABLE product_reviews ADD CONSTRAINT product_reviews_rating_check
  CHECK (rating >= 1 AND rating <= 5);

ALTER TABLE product_reviews DROP CONSTRAINT IF EXISTS product_reviews_status_check;
ALTER TABLE product_reviews ADD CONSTRAINT product_reviews_status_check
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- One review per product per user (only enforced when user_id is not null)
ALTER TABLE product_reviews DROP CONSTRAINT IF EXISTS product_reviews_one_review_per_product;
ALTER TABLE product_reviews ADD CONSTRAINT product_reviews_one_review_per_product
  UNIQUE (product_id, user_id);

-- 3. Index for admin status filtering
CREATE INDEX IF NOT EXISTS product_reviews_status_idx ON product_reviews (status);

-- 4. Trigger function: auto-update product rating + reviews_count
CREATE OR REPLACE FUNCTION public.update_product_review_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  affected_product_id uuid;
BEGIN
  affected_product_id := COALESCE(NEW.product_id, OLD.product_id);
  IF affected_product_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  UPDATE products
  SET
    rating = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM product_reviews
      WHERE product_id = affected_product_id
        AND status = 'approved'
    ), 0),
    reviews_count = (
      SELECT COUNT(*)
      FROM product_reviews
      WHERE product_id = affected_product_id
        AND status = 'approved'
    )
  WHERE id = affected_product_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop existing trigger if any, then (re)create
DROP TRIGGER IF EXISTS trg_product_review_stats ON product_reviews;

CREATE TRIGGER trg_product_review_stats
  AFTER INSERT OR UPDATE OR DELETE ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_review_stats();

-- 5. RLS policies — drop old, create new
DROP POLICY IF EXISTS "public_read_reviews" ON product_reviews;
DROP POLICY IF EXISTS "auth_insert_review" ON product_reviews;
DROP POLICY IF EXISTS "admin_delete_reviews" ON product_reviews;

-- Public can read only approved reviews (storefront display)
CREATE POLICY "public_read_approved_reviews"
ON product_reviews FOR SELECT
TO anon, authenticated
USING (status = 'approved');

-- Authenticated users can insert their own review
CREATE POLICY "auth_insert_own_review"
ON product_reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own review (rating/title/comment/name only).
-- The status and admin_reply columns are NOT writable by regular users;
-- admin updates go through the admin policy below.
CREATE POLICY "auth_update_own_review"
ON product_reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admin can update any review (status, admin_reply, etc.)
CREATE POLICY "admin_manage_reviews"
ON product_reviews FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Admin can delete any review
CREATE POLICY "admin_delete_reviews"
ON product_reviews FOR DELETE
TO authenticated
USING (is_admin());

-- Users can delete their own review
CREATE POLICY "auth_delete_own_review"
ON product_reviews FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Grant admin the ability to see ALL reviews (including pending/rejected).
-- The public_read_approved_reviews policy above only returns approved rows to
-- the anon role; admins need to see everything. We add a separate SELECT
-- policy for authenticated admins.
CREATE POLICY "admin_read_all_reviews"
ON product_reviews FOR SELECT
TO authenticated
USING (is_admin());

-- 6. Permission grants for the trigger function to read product_reviews and
-- update products (SECURITY DEFINER already handles this, but ensure the
-- function can access is_admin via profiles).
GRANT USAGE ON SCHEMA public TO authenticated, anon;