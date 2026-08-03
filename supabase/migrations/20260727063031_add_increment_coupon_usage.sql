/*
# Add increment_coupon_usage RPC

## Purpose
Edge function calls this to bump coupon used_count after a successful order.

## Changes
- New function public.increment_coupon_usage(code_input text)
- SECURITY DEFINER so the service-role / anon client can call it
- Idempotent-safe: only increments if the coupon exists and is still under its usage limit
*/

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(code_input text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE code = upper(code_input)
    AND active = true
    AND (usage_limit IS NULL OR used_count < usage_limit);
END;
$$;
