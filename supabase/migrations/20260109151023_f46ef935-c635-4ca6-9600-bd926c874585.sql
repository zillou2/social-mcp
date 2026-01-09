-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enum for intent categories
CREATE TYPE intent_category AS ENUM (
  'professional', 
  'romance', 
  'friendship', 
  'expertise', 
  'sports', 
  'learning',
  'other'
);

-- Create enum for connection status
CREATE TYPE connection_status AS ENUM (
  'pending_a',      -- Waiting for user A to accept
  'pending_b',      -- Waiting for user B to accept
  'accepted',       -- Both accepted, can chat
  'rejected',       -- One party rejected
  'expired'         -- No response within time limit
);

-- Create enum for message type
CREATE TYPE message_type AS ENUM (
  'text',
  'system',
  'intro'
);

-- User profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mcp_client_id TEXT UNIQUE NOT NULL,  -- Unique identifier from MCP client
  display_name TEXT,
  bio TEXT,
  location TEXT,
  profile_data JSONB DEFAULT '{}'::jsonb,  -- Flexible additional profile fields
  embedding vector(1536),  -- For AI-powered matching
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User intents table (what they're looking for)
CREATE TABLE public.intents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category intent_category NOT NULL,
  description TEXT NOT NULL,  -- Natural language description
  criteria JSONB DEFAULT '{}'::jsonb,  -- Structured criteria
  embedding vector(1536),  -- For semantic matching
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Potential matches identified by the system
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intent_a_id UUID NOT NULL REFERENCES public.intents(id) ON DELETE CASCADE,
  intent_b_id UUID NOT NULL REFERENCES public.intents(id) ON DELETE CASCADE,
  profile_a_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_b_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_score NUMERIC(5, 4) NOT NULL,  -- 0.0000 to 1.0000
  match_reason TEXT,  -- AI-generated explanation
  status connection_status DEFAULT 'pending_a',
  a_accepted_at TIMESTAMP WITH TIME ZONE,
  b_accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT different_profiles CHECK (profile_a_id != profile_b_id),
  CONSTRAINT unique_match UNIQUE (intent_a_id, intent_b_id)
);

-- Messages between connected users
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_type message_type DEFAULT 'text',
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notifications queue for MCP resource subscriptions
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,  -- 'new_match', 'match_accepted', 'new_message', etc.
  payload JSONB NOT NULL,
  is_delivered BOOLEAN DEFAULT false,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- MCP API keys for authentication
CREATE TABLE public.mcp_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_hash TEXT NOT NULL UNIQUE,  -- Hashed API key
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT,
  scopes TEXT[] DEFAULT ARRAY['read', 'write'],
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_profiles_mcp_client_id ON public.profiles(mcp_client_id);
CREATE INDEX idx_profiles_embedding ON public.profiles USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_intents_profile_id ON public.intents(profile_id);
CREATE INDEX idx_intents_category ON public.intents(category);
CREATE INDEX idx_intents_embedding ON public.intents USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_matches_profile_a ON public.matches(profile_a_id);
CREATE INDEX idx_matches_profile_b ON public.matches(profile_b_id);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_messages_match_id ON public.messages(match_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_profile_id);
CREATE INDEX idx_notifications_profile ON public.notifications(profile_id);
CREATE INDEX idx_notifications_undelivered ON public.notifications(profile_id) WHERE is_delivered = false;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow edge functions to manage all data via service role
-- For MCP server access, we'll use service role key in edge functions

CREATE POLICY "Service role full access to profiles" ON public.profiles
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to intents" ON public.intents
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to matches" ON public.matches
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to messages" ON public.messages
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to notifications" ON public.notifications
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to mcp_api_keys" ON public.mcp_api_keys
  FOR ALL USING (true) WITH CHECK (true);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_intents_updated_at
  BEFORE UPDATE ON public.intents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create notification on new match
CREATE OR REPLACE FUNCTION public.notify_new_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify user A about the new match
  INSERT INTO public.notifications (profile_id, notification_type, payload)
  VALUES (
    NEW.profile_a_id,
    'new_match',
    jsonb_build_object(
      'match_id', NEW.id,
      'match_score', NEW.match_score,
      'match_reason', NEW.match_reason
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_notify_new_match
  AFTER INSERT ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_match();

-- Function to notify when match is accepted by both parties
CREATE OR REPLACE FUNCTION public.notify_match_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Notify both users
    INSERT INTO public.notifications (profile_id, notification_type, payload)
    VALUES 
      (NEW.profile_a_id, 'match_accepted', jsonb_build_object('match_id', NEW.id, 'with_profile_id', NEW.profile_b_id)),
      (NEW.profile_b_id, 'match_accepted', jsonb_build_object('match_id', NEW.id, 'with_profile_id', NEW.profile_a_id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_notify_match_accepted
  AFTER UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.notify_match_accepted();

-- Function to notify on new message
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  match_record RECORD;
BEGIN
  SELECT * INTO match_record FROM public.matches WHERE id = NEW.match_id;
  
  -- Determine recipient
  IF NEW.sender_profile_id = match_record.profile_a_id THEN
    recipient_id := match_record.profile_b_id;
  ELSE
    recipient_id := match_record.profile_a_id;
  END IF;
  
  INSERT INTO public.notifications (profile_id, notification_type, payload)
  VALUES (
    recipient_id,
    'new_message',
    jsonb_build_object(
      'match_id', NEW.match_id,
      'message_id', NEW.id,
      'sender_profile_id', NEW.sender_profile_id,
      'preview', LEFT(NEW.content, 100)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;