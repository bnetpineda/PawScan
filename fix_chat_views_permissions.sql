-- Combined script to fix permissions for both veterinarians and user_display_names views
-- This script ensures that authenticated users can access both views

-- Fix permissions for the veterinarians view
-- First, let's verify the view exists and recreate it with proper permissions
DROP VIEW IF EXISTS public.veterinarians;
CREATE VIEW public.veterinarians AS
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->'options'->'data'->>'display_name' as display_name
FROM auth.users u
WHERE 
  u.raw_user_meta_data->'options'->'data'->>'role' = 'Veterinarian'
  AND u.email_confirmed_at IS NOT NULL; -- Only include users who have confirmed their email

-- Grant SELECT permission to authenticated users
GRANT SELECT ON public.veterinarians TO authenticated;

-- Add a comment to document the view
COMMENT ON VIEW public.veterinarians IS 'View of veterinarian display names for chat functionality';

-- Fix permissions for the user_display_names view
-- First, let's verify the view exists and recreate it with proper permissions
DROP VIEW IF EXISTS public.user_display_names;
CREATE VIEW public.user_display_names AS
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->'options'->'data'->>'display_name' as display_name
FROM auth.users u
WHERE 
  u.email_confirmed_at IS NOT NULL; -- Only include users who have confirmed their email

-- Grant SELECT permission to authenticated users
GRANT SELECT ON public.user_display_names TO authenticated;

-- Add a comment to document the view
COMMENT ON VIEW public.user_display_names IS 'View of user display names for chat functionality';