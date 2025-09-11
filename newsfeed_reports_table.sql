-- Table for storing post reports
CREATE TABLE public.newsfeed_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  reporter_user_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT newsfeed_reports_pkey PRIMARY KEY (id),
  CONSTRAINT newsfeed_reports_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.newsfeed_posts(id) ON DELETE CASCADE,
  CONSTRAINT newsfeed_reports_reporter_user_id_fkey FOREIGN KEY (reporter_user_id) REFERENCES auth.users(id),
  
  -- Ensure a user can only report a post once
  CONSTRAINT newsfeed_reports_unique_report UNIQUE (post_id, reporter_user_id)
);

-- Indexes for better performance
CREATE INDEX idx_newsfeed_reports_post_id ON public.newsfeed_reports (post_id);
CREATE INDEX idx_newsfeed_reports_reporter_user_id ON public.newsfeed_reports (reporter_user_id);
CREATE INDEX idx_newsfeed_reports_status ON public.newsfeed_reports (status);
CREATE INDEX idx_newsfeed_reports_created_at ON public.newsfeed_reports (created_at);