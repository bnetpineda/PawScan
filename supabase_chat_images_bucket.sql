-- Create the chat-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up access controls for the chat-images bucket
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-images');

-- Allow anyone to read chat images (since they're public)
CREATE POLICY "Anyone can read chat images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'chat-images');