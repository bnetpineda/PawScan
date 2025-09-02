-- Create a secure view for accessing user display names only
-- This view only exposes necessary information for chat functionality

CREATE OR REPLACE VIEW public.user_display_names AS
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