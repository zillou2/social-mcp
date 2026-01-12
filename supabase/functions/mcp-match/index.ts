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
      // Get all matches for this profile
      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          *,
          intent_a:intents!matches_intent_a_id_fkey(category, description),
          intent_b:intents!matches_intent_b_id_fkey(category, description),
          profile_a:profiles!matches_profile_a_id_fkey(display_name, bio),
          profile_b:profiles!matches_profile_b_id_fkey(display_name, bio)
        `)
        .or(`profile_a_id.eq.${profileId},profile_b_id.eq.${profileId}`)
        .neq('status', 'expired')
        .neq('status', 'rejected');

      if (error) throw error;

      // Transform to hide private info based on status
      const transformedMatches = matches.map(match => {
        const isProfileA = match.profile_a_id === profileId;
        const otherProfile = isProfileA ? match.profile_b : match.profile_a;
        const myIntent = isProfileA ? match.intent_a : match.intent_b;
        const theirIntent = isProfileA ? match.intent_b : match.intent_a;

        return {
          id: match.id,
          status: match.status,
          match_score: match.match_score,
          match_reason: match.match_reason,
          my_intent: myIntent,
          their_intent: theirIntent,
          // Only show profile details if accepted
          other_profile: match.status === 'accepted' ? otherProfile : {
            display_name: otherProfile?.display_name || 'Anonymous',
            bio: null // Hide bio until accepted
          },
          created_at: match.created_at,
          expires_at: match.expires_at,
          requires_my_action: (isProfileA && match.status === 'pending_a') || 
                              (!isProfileA && match.status === 'pending_b')
        };
      });

      return new Response(
        JSON.stringify({ matches: transformedMatches }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const { match_id, action } = await req.json();

      if (!match_id || !['accept', 'reject'].includes(action)) {
        return new Response(
          JSON.stringify({ error: 'match_id and action (accept/reject) required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', match_id)
        .single();

      if (matchError || !match) {
        return new Response(
          JSON.stringify({ error: 'Match not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify profile is part of this match
      const isProfileA = match.profile_a_id === profileId;
      const isProfileB = match.profile_b_id === profileId;
      if (!isProfileA && !isProfileB) {
        return new Response(
          JSON.stringify({ error: 'Not authorized for this match' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'reject') {
        await supabase
          .from('matches')
          .update({ status: 'rejected' })
          .eq('id', match_id);

        return new Response(
          JSON.stringify({ success: true, message: 'Match rejected' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Handle accept
      const now = new Date().toISOString();
      let newStatus = match.status;
      const updates: Record<string, unknown> = {};

      if (isProfileA && match.status === 'pending_a') {
        updates.a_accepted_at = now;
        newStatus = 'pending_b';
      } else if (isProfileB && match.status === 'pending_b') {
        updates.b_accepted_at = now;
        newStatus = 'accepted';
      }

      updates.status = newStatus;

      await supabase
        .from('matches')
        .update(updates)
        .eq('id', match_id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          status: newStatus,
          message: newStatus === 'accepted' 
            ? 'Match accepted! You can now chat.' 
            : 'Waiting for the other party to accept.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Match error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
