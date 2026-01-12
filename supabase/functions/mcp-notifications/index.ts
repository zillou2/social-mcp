import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { authenticateRequest } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const profileId = await authenticateRequest(req);
    if (!profileId) {
      return new Response(
        JSON.stringify({ error: 'Authentication required (API key or profile_id)' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (req.method === 'GET') {
      // Get undelivered notifications
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', profileId)
        .eq('is_delivered', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mark as delivered
      if (notifications && notifications.length > 0) {
        await supabase
          .from('notifications')
          .update({ 
            is_delivered: true,
            delivered_at: new Date().toISOString()
          })
          .in('id', notifications.map(n => n.id));
      }

      return new Response(
        JSON.stringify({ 
          notifications: notifications.map(n => ({
            id: n.id,
            type: n.notification_type,
            payload: n.payload,
            created_at: n.created_at
          }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Notifications error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
