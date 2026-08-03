/*
# Expand order statuses to full fulfillment lifecycle

## What this does
Drops the existing order_status CHECK constraint on the orders table and adds a new
one that allows 10 statuses instead of the original 6, enabling a complete
professional order management workflow.

## New allowed values
- pending, confirmed, processing, packed, shipped, out_for_delivery, delivered,
  cancelled, declined, refunded

## Data safety
- No data is lost or modified. All existing orders keep their current status values.
- All previous status values (pending, confirmed, packed, shipped, delivered, cancelled)
  remain valid in the new constraint.
- No RLS or policy changes. Existing access controls remain in place.

## Important notes
1. The constraint is dropped and re-added in a single migration — safe to re-run.
2. No new tables or columns are created.
3. Existing checkout, payment, and invoice logic is unaffected — they only set
   the initial 'pending' status, which remains valid.
*/

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_order_status_check
  CHECK (order_status IN ('pending','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled','declined','refunded'));
