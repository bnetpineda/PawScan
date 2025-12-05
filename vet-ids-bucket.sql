-- =============================================
-- VET-IDS STORAGE BUCKET SETUP
-- =============================================
-- Run this AFTER creating the bucket in Supabase Dashboard:
-- 1. Go to Storage > Create new bucket
-- 2. Name: vet-ids
-- 3. Public bucket: YES (toggle ON)
-- 4. Then run this SQL in the SQL Editor

-- Allow anyone to upload to vet-ids bucket (for registration)
CREATE POLICY "Allow public uploads to vet-ids"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'vet-ids');

-- Allow anyone to read from vet-ids bucket (for admin review)
CREATE POLICY "Allow public read from vet-ids"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'vet-ids');

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated updates to vet-ids"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'vet-ids');

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated deletes from vet-ids"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vet-ids');
