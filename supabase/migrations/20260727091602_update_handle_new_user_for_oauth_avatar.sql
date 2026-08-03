-- Update handle_new_user trigger to capture avatar_url from OAuth metadata (Google, etc.)
-- Uses COALESCE to fall back across provider-specific metadata key names:
--   full_name / name  -> profile name
--   avatar_url / picture -> profile picture URL
-- Safe: CREATE OR REPLACE updates the function in place; no data is lost.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, avatar_url, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    (SELECT count(*) = 0 FROM public.profiles)
  );
  RETURN NEW;
END;
$$;
