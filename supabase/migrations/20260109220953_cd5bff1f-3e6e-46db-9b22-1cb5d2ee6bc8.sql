-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Enable realtime for messages table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;