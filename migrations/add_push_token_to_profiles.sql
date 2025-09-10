-- Migration script to add push_token column to profiles table
-- This assumes you have a profiles table. If not, you may need to adjust accordingly.

-- Add push_token column to profiles table
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_push_token 
ON public.profiles(push_token);

-- Enable RLS (Row Level Security) if not already enabled
ALTER TABLE IF EXISTS public.profiles 
ENABLE ROW LEVEL SECURITY;

-- Update existing policies to allow users to update their own push tokens
DROP POLICY IF EXISTS "Users can update their own push token" ON public.profiles;

CREATE POLICY "Users can update their own push token"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

COMMENT ON COLUMN public.profiles.push_token IS 'Expo push notification token for the user';