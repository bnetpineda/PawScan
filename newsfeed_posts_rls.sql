-- Enable RLS on newsfeed_posts table
ALTER TABLE newsfeed_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all posts
CREATE POLICY "Users can view all posts" 
ON newsfeed_posts FOR SELECT 
TO authenticated 
USING (true);

-- Policy: Users can insert their own posts
CREATE POLICY "Users can insert their own posts" 
ON newsfeed_posts FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own posts
CREATE POLICY "Users can update their own posts" 
ON newsfeed_posts FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- Policy: Users can delete their own posts
CREATE POLICY "Users can delete their own posts" 
ON newsfeed_posts FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());