-- Create a secure view for accessing veterinarian information
-- This view only exposes necessary information and respects user roles

CREATE OR REPLACE VIEW public.veterinarians AS
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data
FROM auth.users u
WHERE 
  u.raw_user_meta_data->'options'->'data'->>'role' = 'Veterinarian'
  AND u.email_confirmed_at IS NOT NULL; -- Only include users who have confirmed their email

-- Grant SELECT permission to authenticated users
GRANT SELECT ON public.veterinarians TO authenticated;

-- Add a comment to document the view
COMMENT ON VIEW public.veterinarians IS 'View of all veterinarians that can be accessed by authenticated users';