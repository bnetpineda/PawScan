-- Add image_url column to messages table for storing image attachments
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS image_url text;