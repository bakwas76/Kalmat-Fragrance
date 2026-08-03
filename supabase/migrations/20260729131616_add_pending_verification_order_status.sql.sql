/*
# Add pending_verification as a valid order_status

## Problem
The Admin > Orders page needs a "Pending Verification" option in the order status
dropdown so admins can mark Manual Payment orders as awaiting payment verification
until a receipt is reviewed. The current `orders_order_status_check` constraint
only allows 10 statuses and does not include `pending_verification`.

## Change
Drop and recreate the CHECK constraint on `orders.order_status` to add
`pending_verification` as an allowed value. This is purely additive — all
previously-allowed values remain allowed, so existing rows are unaffected.

## Scope
- Only the `orders_order_status_check` constraint is modified.
- No tables, columns, data, RLS policies, triggers, or functions are touched.
- Checkout, invoices, payments, auth, tracking, products, and reviews are unchanged.
- `pending_verification` already exists as a valid `payment_status` (unchanged).
- It is now ALSO valid as an `order_status` for the admin dropdown.

## Notes
- COD (Cash on Delivery) orders should NEVER be set to `pending_verification` as an
  order status — that is enforced in the Admin Orders UI, which only shows the
  option for Manual Payment orders.
- The existing `pending` order status (different from `pending_verification`) is
  unchanged and remains the default for new orders.
*/

ALTER TABLE public.orders DROP CONSTRAINT orders_order_status_check;

ALTER TABLE public.orders ADD CONSTRAINT orders_order_status_check
CHECK (
  order_status IN (
    'pending',
    'pending_verification',
    'confirmed',
    'processing',
    'packed',
    'shipped',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'declined',
    'refunded'
  )
);
