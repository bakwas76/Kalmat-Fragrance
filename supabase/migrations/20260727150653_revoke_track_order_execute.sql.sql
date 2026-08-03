-- Revoke EXECUTE on track_order from anon and authenticated.
-- Guest order lookup is now handled by the track-order edge function
-- (service role key), so the SECURITY DEFINER RPC is no longer needed
-- from the API surface.
REVOKE EXECUTE ON FUNCTION public.track_order(text, text) FROM anon, authenticated;
