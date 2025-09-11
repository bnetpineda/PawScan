-- Check if RLS is enabled on newsfeed_posts
SELECT tablename, relname, relacl FROM pg_tables WHERE tablename = 'newsfeed_posts';

-- Check existing policies on newsfeed_posts
SELECT * FROM pg_policy WHERE polrelid = 'newsfeed_posts'::regclass;