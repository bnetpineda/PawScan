-- Enable RLS on newsfeed_reports table
ALTER TABLE newsfeed_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own reports
CREATE POLICY "Users can view their own reports" 
ON newsfeed_reports FOR SELECT 
TO authenticated 
USING (reporter_user_id = auth.uid());

-- Policy: Users can insert their own reports
CREATE POLICY "Users can insert their own reports" 
ON newsfeed_reports FOR INSERT 
TO authenticated 
WITH CHECK (reporter_user_id = auth.uid());

-- Policy: Users can update their own reports
CREATE POLICY "Users can update their own reports" 
ON newsfeed_reports FOR UPDATE 
TO authenticated 
USING (reporter_user_id = auth.uid());

-- Policy: Users can view reports on their own posts
CREATE POLICY "Users can view reports on their posts" 
ON newsfeed_reports FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM newsfeed_posts 
    WHERE newsfeed_posts.id = newsfeed_reports.post_id 
    AND newsfeed_posts.user_id = auth.uid()
  )
);