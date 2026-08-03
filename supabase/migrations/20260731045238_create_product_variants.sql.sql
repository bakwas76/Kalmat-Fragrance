-- Product Variants system
-- Each product can have multiple size variants (3ml, 6ml, 30ml, 50ml, 100ml)
-- with independent price, sale price, stock, SKU, and weight.
-- Backfills one default variant per existing product from current price/stock.

CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size_label text NOT NULL,
  volume_ml integer NOT NULL DEFAULT 0,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  compare_at_price numeric(10,2) CHECK (compare_at_price >= price OR compare_at_price IS NULL),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku text,
  weight text,
  sort_order integer NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_variants_product_id_idx ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS product_variants_product_id_sort_idx ON public.product_variants(product_id, sort_order);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_product_variants" ON public.product_variants;
CREATE POLICY "public_read_product_variants" ON public.product_variants
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_product_variants" ON public.product_variants;
CREATE POLICY "admin_insert_product_variants" ON public.product_variants
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_product_variants" ON public.product_variants;
CREATE POLICY "admin_update_product_variants" ON public.product_variants
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_product_variants" ON public.product_variants;
CREATE POLICY "admin_delete_product_variants" ON public.product_variants
  FOR DELETE TO authenticated USING (public.is_admin());

-- Backfill: create one default variant per existing product from current columns
INSERT INTO public.product_variants (product_id, size_label, volume_ml, price, compare_at_price, stock, sku, sort_order, is_default)
SELECT
  p.id,
  p.volume_ml::text || 'ml',
  p.volume_ml,
  p.price,
  p.compare_at_price,
  p.stock,
  p.sku,
  0,
  true
FROM public.products p
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_variants pv WHERE pv.product_id = p.id
);
