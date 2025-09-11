-- RLS Policies for Newsfeed Comments and Likes Tables
-- This file contains Row Level Security policies to control access to newsfeed interactions

-- Enable RLS on newsfeed_comments table
ALTER TABLE newsfeed_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all comments (read-only for everyone)
CREATE POLICY "Users can view all comments" 
ON newsfeed_comments FOR SELECT 
TO authenticated 
USING (true);

-- Policy: Users can insert their own comments
CREATE POLICY "Users can insert their own comments" 
ON newsfeed_comments FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own comments
CREATE POLICY "Users can update their own comments" 
ON newsfeed_comments FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own comments" 
ON newsfeed_comments FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- Enable RLS on newsfeed_likes table
ALTER TABLE newsfeed_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all likes (read-only for everyone)
CREATE POLICY "Users can view all likes" 
ON newsfeed_likes FOR SELECT 
TO authenticated 
USING (true);

-- Policy: Users can insert their own likes
CREATE POLICY "Users can insert their own likes" 
ON newsfeed_likes FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own likes
CREATE POLICY "Users can delete their own likes" 
ON newsfeed_likes FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- Optional: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsfeed_comments_post_id ON newsfeed_comments (post_id);
CREATE INDEX IF NOT EXISTS idx_newsfeed_comments_user_id ON newsfeed_comments (user_id);
CREATE INDEX IF NOT EXISTS idx_newsfeed_likes_post_id ON newsfeed_likes (post_id);
CREATE INDEX IF NOT EXISTS idx_newsfeed_likes_user_id ON newsfeed_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_newsfeed_likes_unique ON newsfeed_likes (post_id, user_id);