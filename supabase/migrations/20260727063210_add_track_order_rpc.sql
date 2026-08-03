/*
# Add track_order RPC for guest order tracking

## Purpose
The orders table has RLS that only allows authenticated owners + admins to SELECT.
Guests who placed an order (anon) need a way to look up their order by order number + email
without logging in. This SECURITY DEFINER function performs that safe lookup.

## Changes
- New function public.track_order(order_num text, email_input text)
- SECURITY DEFINER so it runs with elevated privileges (bypasses RLS for the read)
- Returns the matching order row, or NULL if no match
- Only matches when BOTH order_number AND email match (so a guest can't enumerate orders)
*/

CREATE OR REPLACE FUNCTION public.track_order(order_num text, email_input text)
RETURNS public.orders
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT * FROM public.orders
  WHERE order_number = upper(order_num)
    AND lower(email) = lower(email_input)
  LIMIT 1;
$$;

-- Allow anon + authenticated to call this lookup
REVOKE ALL ON FUNCTION public.track_order(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_order(text, text) TO anon, authenticated;
