-- ============================================
-- PawScan In-App Notifications System
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sender_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  related_id uuid,
  related_type text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- System can insert notifications (this will be handled by triggers or application logic)
CREATE POLICY "Enable insert for authenticated users" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- ============================================
-- Trigger Functions for Auto Notifications
-- ============================================

-- Function to create notification for new comment on post
CREATE OR REPLACE FUNCTION notify_post_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if the commenter is not the post owner
  IF NEW.user_id != (SELECT user_id FROM public.newsfeed_posts WHERE id = NEW.post_id) THEN
    INSERT INTO public.notifications (
      user_id,
      sender_id,
      type,
      title,
      content,
      related_id,
      related_type
    )
    SELECT 
      p.user_id,
      NEW.user_id,
      'comment',
      'New Comment on Your Post',
      CASE 
        WHEN NEW.display_name IS NOT NULL THEN NEW.display_name || ' commented on your post'
        ELSE 'Someone commented on your post'
      END,
      NEW.post_id,
      'post'
    FROM public.newsfeed_posts p
    WHERE p.id = NEW.post_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification for new chat message
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id uuid;
  sender_name text;
BEGIN
  -- Determine the recipient (the other person in the conversation)
  SELECT 
    CASE 
      WHEN c.user_id = NEW.sender_id THEN c.vet_id
      ELSE c.user_id
    END INTO recipient_id
  FROM public.conversations c
  WHERE c.id = NEW.conversation_id;
  
  -- Get sender's name
  SELECT COALESCE(
    (SELECT name FROM public.vet_profiles WHERE id = NEW.sender_id),
    (SELECT name FROM public.user_profiles WHERE id = NEW.sender_id),
    'Someone'
  ) INTO sender_name;
  
  -- Only notify if the recipient is not the sender
  IF recipient_id IS NOT NULL AND recipient_id != NEW.sender_id THEN
    INSERT INTO public.notifications (
      user_id,
      sender_id,
      type,
      title,
      content,
      related_id,
      related_type
    )
    VALUES (
      recipient_id,
      NEW.sender_id,
      'message',
      'New Message',
      sender_name || ' sent you a message',
      NEW.conversation_id,
      'conversation'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification for new like on post
CREATE OR REPLACE FUNCTION notify_post_like()
RETURNS TRIGGER AS $$
DECLARE
  liker_name text;
BEGIN
  -- Get liker's name
  SELECT COALESCE(
    (SELECT name FROM public.vet_profiles WHERE id = NEW.user_id),
    (SELECT name FROM public.user_profiles WHERE id = NEW.user_id),
    'Someone'
  ) INTO liker_name;
  
  -- Only notify if the liker is not the post owner
  IF NEW.user_id != (SELECT user_id FROM public.newsfeed_posts WHERE id = NEW.post_id) THEN
    INSERT INTO public.notifications (
      user_id,
      sender_id,
      type,
      title,
      content,
      related_id,
      related_type
    )
    SELECT 
      p.user_id,
      NEW.user_id,
      'like',
      'New Like',
      liker_name || ' liked your post',
      NEW.post_id,
      'post'
    FROM public.newsfeed_posts p
    WHERE p.id = NEW.post_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Create Triggers
-- ============================================

-- Trigger for new comments
DROP TRIGGER IF EXISTS trigger_notify_post_comment ON public.newsfeed_comments;
CREATE TRIGGER trigger_notify_post_comment
  AFTER INSERT ON public.newsfeed_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_comment();

-- Trigger for new messages
DROP TRIGGER IF EXISTS trigger_notify_new_message ON public.messages;
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Trigger for new likes
DROP TRIGGER IF EXISTS trigger_notify_post_like ON public.newsfeed_likes;
CREATE TRIGGER trigger_notify_post_like
  AFTER INSERT ON public.newsfeed_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_like();

-- ============================================
-- Helper Functions
-- ============================================

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true, read_at = now()
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for current user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS void AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true, read_at = now()
  WHERE user_id = auth.uid() AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.notifications
    WHERE user_id = auth.uid() AND is_read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete old read notifications (optional - for cleanup)
CREATE OR REPLACE FUNCTION delete_old_notifications(days_old integer DEFAULT 30)
RETURNS void AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE is_read = true 
    AND read_at < (now() - (days_old || ' days')::interval);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Grant necessary permissions
-- ============================================

-- Grant usage on functions
GRANT EXECUTE ON FUNCTION mark_notification_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read() TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count() TO authenticated;
GRANT EXECUTE ON FUNCTION delete_old_notifications(integer) TO authenticated;

-- ============================================
-- Notification Types Reference
-- ============================================
-- 'comment' - Someone commented on your post
-- 'message' - New chat message received
-- 'like' - Someone liked your post
-- 'reply' - Someone replied to your comment (can be added later)
-- ============================================

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'Notifications system installed successfully!';
  RAISE NOTICE 'Created tables: notifications';
  RAISE NOTICE 'Created triggers: comment, message, like notifications';
  RAISE NOTICE 'Created helper functions for managing notifications';
END $$;
