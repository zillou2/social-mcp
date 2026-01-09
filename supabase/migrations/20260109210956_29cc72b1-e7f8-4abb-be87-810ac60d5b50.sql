-- Create sessions table to map MCP session IDs to profiles
CREATE TABLE public.mcp_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mcp_sessions ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (edge functions use service role)
CREATE POLICY "Service role only" ON public.mcp_sessions
  FOR ALL USING (false);

-- Index for fast session lookups
CREATE INDEX idx_mcp_sessions_session_id ON public.mcp_sessions(session_id);

-- Auto-cleanup old sessions (older than 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_mcp_sessions()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.mcp_sessions WHERE last_used_at < now() - interval '30 days';
END;
$$;