-- Update the veterinarians view to only expose necessary information for chat functionality

CREATE OR REPLACE VIEW public.veterinarians AS
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