-- Create typing status table for real-time typing indicators
CREATE TABLE public.typing_status (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  is_typing boolean DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT typing_status_pkey PRIMARY KEY (id),
  CONSTRAINT typing_status_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT typing_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT typing_status_conversation_user_unique UNIQUE (conversation_id, user_id)
);

-- Create index for better performance
CREATE INDEX typing_status_conversation_id_idx ON public.typing_status (conversation_id);
CREATE INDEX typing_status_user_id_idx ON public.typing_status (user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;

-- Create policies for typing status
CREATE POLICY "Users can view typing status in their conversations"
  ON public.typing_status FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE user_id = auth.uid() OR vet_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own typing status"
  ON public.typing_status FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own typing status"
  ON public.typing_status FOR INSERT
  WITH CHECK (user_id = auth.uid());