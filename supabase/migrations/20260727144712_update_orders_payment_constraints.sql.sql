/*
# Update orders payment constraints for manual payment

## Purpose
The checkout was consolidated from three separate manual methods (JazzCash,
Easypaisa, Bank Transfer) into a single "Manual Payment" option. The orders
table, however, still had the original CHECK constraints from the schema init,
which only allowed payment_method IN ('cod','stripe') and payment_status IN
('pending','paid','failed','refunded'). The edge function now inserts
payment_method='manual' and payment_status='pending_verification', both of
which were rejected by the old constraints — causing "Failed to create order"
whenever a customer selected Manual Payment.

## Changes
1. Widen the `payment_method` CHECK on public.orders to allow:
   'cod', 'manual', 'stripe' (stripe retained for backward compatibility
   with any legacy rows; no data is changed).
2. Widen the `payment_status` CHECK on public.orders to allow:
   'pending', 'pending_verification', 'verified', 'rejected', 'paid',
   'failed', 'refunded'. The new values cover the manual-payment lifecycle:
   a manual order starts as 'pending_verification', an admin marks it
   'verified' or 'rejected'. Existing COD/legacy orders keep 'pending'/'paid'.

## Important notes
1. No columns are added, dropped, renamed, or retyped — existing rows are
   untouched. Only the CHECK predicates are widened.
2. This migration is idempotent: re-running it simply re-applies the same
   constraints.
3. The `payment_receipt_url` column was already added by a prior migration
   (add_manual_payment_support) and is not touched here.
*/

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('cod', 'manual', 'stripe'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'pending_verification', 'verified', 'rejected', 'paid', 'failed', 'refunded'));
