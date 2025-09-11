-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.analysis_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  image_url text,
  analysis_result text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT analysis_history_pkey PRIMARY KEY (id),
  CONSTRAINT analysis_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  vet_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT conversations_vet_id_fkey FOREIGN KEY (vet_id) REFERENCES auth.users(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read boolean DEFAULT false,
  image_url text,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id)
);
CREATE TABLE public.newsfeed_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid,
  user_id uuid,
  comment_text text NOT NULL,
  display_name text,
  created_at timestamp with time zone DEFAULT now(),
  role text,
  CONSTRAINT newsfeed_comments_pkey PRIMARY KEY (id),
  CONSTRAINT newsfeed_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.newsfeed_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT newsfeed_likes_pkey PRIMARY KEY (id),
  CONSTRAINT newsfeed_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.newsfeed_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  image_url text NOT NULL,
  analysis_result text,
  pet_name text,
  display_name text,
  is_anonymous boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  analysis_id uuid DEFAULT gen_random_uuid(),
  CONSTRAINT newsfeed_posts_pkey PRIMARY KEY (id),
  CONSTRAINT newsfeed_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.newsfeed_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  reporter_user_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT newsfeed_reports_pkey PRIMARY KEY (id),
  CONSTRAINT newsfeed_reports_reporter_user_id_fkey FOREIGN KEY (reporter_user_id) REFERENCES auth.users(id),
  CONSTRAINT newsfeed_reports_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.newsfeed_posts(id)
);
CREATE TABLE public.typing_status (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  is_typing boolean DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT typing_status_pkey PRIMARY KEY (id),
  CONSTRAINT typing_status_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT typing_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);