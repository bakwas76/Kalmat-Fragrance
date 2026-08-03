/*
# Kalmat Fragrance — Initial Schema

## Purpose
Full-stack luxury perfume e-commerce. Supports product catalog, cart, guest + authenticated
checkout, order tracking, wishlist, saved addresses, reviews, coupons, newsletter, contact
messages, and an admin panel.

## Tables created
1. profiles — extends auth.users with full_name, phone, avatar, is_admin flag.
2. categories — perfume categories (e.g. Floral, Woody, Oriental, Fresh).
3. collections — curated marketing collections.
4. products — full product catalog with pricing, stock, notes, volume, brand, gender, flags.
5. product_reviews — customer reviews tied to a product and (optionally) a user.
6. coupons — discount codes (percentage or fixed), usage limits, expiry.
7. orders — full order record with line items as JSONB, addresses, totals, status, payment.
8. wishlists — per-user saved products.
9. addresses — per-user saved shipping/billing addresses.
10. newsletter_subscribers — email opt-ins.
11. contact_messages — submissions from the contact page.

## Security (RLS)
- profiles: owner-scoped read/update; admin can read all.
- categories / collections / products / coupons: public SELECT (anon + authenticated);
  admin-only INSERT/UPDATE/DELETE (guarded by is_admin() helper).
- product_reviews: public SELECT; authenticated INSERT (own review); admin DELETE.
- orders: public INSERT (guests can place orders); authenticated owner SELECT;
  admin SELECT/UPDATE for status management. Guest order reads via edge function (service role).
- wishlists / addresses: owner-scoped CRUD.
- newsletter_subscribers: public INSERT; admin SELECT/DELETE.
- contact_messages: public INSERT; admin SELECT/UPDATE/DELETE.

## Helpers
- is_admin() — stable SQL function returning true if the current auth user has is_admin = true.
  Created BEFORE any RLS policy references it.
- handle_new_user() — trigger creating a profile row on signup. First user becomes admin (bootstrap).

## Notes
- All owner columns default to auth.uid() so client inserts omitting the owner still satisfy RLS.
- Idempotent: uses IF NOT EXISTS and DROP POLICY IF EXISTS before each CREATE POLICY.
- profiles created before is_admin(); is_admin() created before any RLS policy that uses it.
*/

-- ---------------------------------------------------------------------------
-- profiles (table only, no RLS yet — is_admin() must exist first)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  avatar_url text,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Helper: is_admin()  (created before any RLS policy that references it)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$;

-- Now safe to enable RLS + policies on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Trigger: auto-create profile on auth signup (first user becomes admin)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, is_admin)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    (SELECT count(*) = 0 FROM public.profiles)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_categories" ON public.categories;
CREATE POLICY "public_read_categories" ON public.categories
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_categories" ON public.categories;
CREATE POLICY "admin_insert_categories" ON public.categories
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_categories" ON public.categories;
CREATE POLICY "admin_update_categories" ON public.categories
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_categories" ON public.categories;
CREATE POLICY "admin_delete_categories" ON public.categories
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- collections
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_collections" ON public.collections;
CREATE POLICY "public_read_collections" ON public.collections
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_collections" ON public.collections;
CREATE POLICY "admin_insert_collections" ON public.collections
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_collections" ON public.collections;
CREATE POLICY "admin_update_collections" ON public.collections
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_collections" ON public.collections;
CREATE POLICY "admin_delete_collections" ON public.collections
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  compare_at_price numeric(10,2) CHECK (compare_at_price >= price OR compare_at_price IS NULL),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL,
  brand text NOT NULL DEFAULT 'Kalmat Fragrance',
  gender text NOT NULL DEFAULT 'unisex' CHECK (gender IN ('men','women','unisex')),
  volume_ml integer NOT NULL DEFAULT 100,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  featured boolean NOT NULL DEFAULT false,
  is_new boolean NOT NULL DEFAULT false,
  best_seller boolean NOT NULL DEFAULT false,
  rating numeric(2,1) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  reviews_count integer NOT NULL DEFAULT 0,
  top_notes text[] NOT NULL DEFAULT '{}',
  middle_notes text[] NOT NULL DEFAULT '{}',
  base_notes text[] NOT NULL DEFAULT '{}',
  ingredients text,
  bottle_shape text NOT NULL DEFAULT 'classic',
  bottle_glass text NOT NULL DEFAULT '#1a1a2e',
  bottle_cap text NOT NULL DEFAULT '#C9A227',
  bottle_label text NOT NULL DEFAULT '#C9A227',
  sku text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_id_idx ON public.products(category_id);
CREATE INDEX IF NOT EXISTS products_collection_id_idx ON public.products(collection_id);
CREATE INDEX IF NOT EXISTS products_slug_idx ON public.products(slug);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_products" ON public.products;
CREATE POLICY "public_read_products" ON public.products
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_products" ON public.products;
CREATE POLICY "admin_insert_products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_products" ON public.products;
CREATE POLICY "admin_update_products" ON public.products
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_products" ON public.products;
CREATE POLICY "admin_delete_products" ON public.products
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- product_reviews
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_reviews_product_id_idx ON public.product_reviews(product_id);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_reviews" ON public.product_reviews;
CREATE POLICY "public_read_reviews" ON public.product_reviews
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_review" ON public.product_reviews;
CREATE POLICY "auth_insert_review" ON public.product_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "admin_delete_reviews" ON public.product_reviews;
CREATE POLICY "admin_delete_reviews" ON public.product_reviews
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- coupons
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('percent','fixed')),
  value numeric(10,2) NOT NULL CHECK (value >= 0),
  min_order numeric(10,2) NOT NULL DEFAULT 0,
  max_discount numeric(10,2),
  usage_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_active_coupons" ON public.coupons;
CREATE POLICY "public_read_active_coupons" ON public.coupons
  FOR SELECT TO anon, authenticated USING (active = true);

DROP POLICY IF EXISTS "admin_insert_coupons" ON public.coupons;
CREATE POLICY "admin_insert_coupons" ON public.coupons
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_coupons" ON public.coupons;
CREATE POLICY "admin_update_coupons" ON public.coupons
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_coupons" ON public.coupons;
CREATE POLICY "admin_delete_coupons" ON public.coupons
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  billing_address jsonb NOT NULL,
  shipping_address jsonb NOT NULL,
  items jsonb NOT NULL,
  subtotal numeric(10,2) NOT NULL,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  shipping_cost numeric(10,2) NOT NULL DEFAULT 0,
  tax numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cod','stripe')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  order_status text NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending','confirmed','packed','shipped','delivered','cancelled')),
  coupon_code text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS orders_order_number_idx ON public.orders(order_number);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_insert_orders" ON public.orders;
CREATE POLICY "anyone_insert_orders" ON public.orders
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "select_own_or_admin_orders" ON public.orders;
CREATE POLICY "select_own_or_admin_orders" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "admin_update_orders" ON public.orders;
CREATE POLICY "admin_update_orders" ON public.orders
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- wishlists
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS wishlists_user_id_idx ON public.wishlists(user_id);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_wishlist" ON public.wishlists;
CREATE POLICY "select_own_wishlist" ON public.wishlists
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_wishlist" ON public.wishlists;
CREATE POLICY "insert_own_wishlist" ON public.wishlists
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_wishlist" ON public.wishlists;
CREATE POLICY "delete_own_wishlist" ON public.wishlists
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- addresses
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  address_line text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  postal_code text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS addresses_user_id_idx ON public.addresses(user_id);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_addresses" ON public.addresses;
CREATE POLICY "select_own_addresses" ON public.addresses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_addresses" ON public.addresses;
CREATE POLICY "insert_own_addresses" ON public.addresses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_addresses" ON public.addresses;
CREATE POLICY "update_own_addresses" ON public.addresses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_addresses" ON public.addresses;
CREATE POLICY "delete_own_addresses" ON public.addresses
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- newsletter_subscribers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_newsletter" ON public.newsletter_subscribers;
CREATE POLICY "public_insert_newsletter" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_newsletter" ON public.newsletter_subscribers;
CREATE POLICY "admin_read_newsletter" ON public.newsletter_subscribers
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_newsletter" ON public.newsletter_subscribers;
CREATE POLICY "admin_delete_newsletter" ON public.newsletter_subscribers
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- contact_messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_messages" ON public.contact_messages;
CREATE POLICY "public_insert_messages" ON public.contact_messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_messages" ON public.contact_messages;
CREATE POLICY "admin_read_messages" ON public.contact_messages
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_messages" ON public.contact_messages;
CREATE POLICY "admin_update_messages" ON public.contact_messages
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_messages" ON public.contact_messages;
CREATE POLICY "admin_delete_messages" ON public.contact_messages
  FOR DELETE TO authenticated USING (public.is_admin());
