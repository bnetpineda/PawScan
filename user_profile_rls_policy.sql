-- RLS Policy for user_profiles table to allow veterinarians to access user profiles 
-- when they are in a conversation together

-- Enable Row Level Security on user_profiles table if not already enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows a vet to read user profile info when they're in a conversation
-- This policy allows access if the current user is a veterinarian and is in a conversation with the user
CREATE POLICY "Allow veterinarians to access user profiles in conversations" ON public.user_profiles
FOR SELECT TO authenticated
USING (
  -- Check if the current user is a veterinarian 
  EXISTS (
    SELECT 1 FROM vet_profiles 
    WHERE vet_profiles.id = auth.uid()
  )
  AND
  -- Check if there's a conversation between the current vet and the user whose profile is being accessed
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.user_id = user_profiles.id 
    AND conversations.vet_id = auth.uid()
  )
);

-- Create a policy to allow users to access their own profile
CREATE POLICY "Allow users to access own profile" ON public.user_profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Create a policy to allow users to update their own profile
CREATE POLICY "Allow users to update own profile" ON public.user_profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create a policy to allow service role to access all profiles (for server-side operations)
CREATE POLICY "Allow service role full access" ON public.user_profiles
FOR ALL TO service_role
USING (true)
WITH CHECK (true);