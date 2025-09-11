-- Fix permissions for the veterinarians view
-- This script ensures that authenticated users can access the veterinarians view

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