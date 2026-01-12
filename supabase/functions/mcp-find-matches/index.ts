import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { authenticateRequest } from '../_shared/auth.ts';

// This function finds matches ONLY for the authenticated user's intents
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

    // Get ONLY the current user's active intents
    const { data: myIntents, error: myIntentsError } = await supabase
      .from('intents')
      .select('*, profile:profiles(*)')
      .eq('profile_id', profileId)
      .eq('is_active', true);

    if (myIntentsError) throw myIntentsError;

    if (!myIntents?.length) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No active intents. Use social_set_intent first.',
          matches_created: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Match] Found ${myIntents.length} intents for profile ${profileId}`);

    // Get my intent categories for smart filtering
    const myCategories = [...new Set(myIntents.map(i => i.category))];

    // Get other users' active intents - prioritize same category and recent
    const { data: otherIntents, error: otherIntentsError } = await supabase
      .from('intents')
      .select('*, profile:profiles(*)')
      .neq('profile_id', profileId)
      .eq('is_active', true)
      .in('category', myCategories) // Only same categories for faster matching
      .order('created_at', { ascending: false })
      .limit(15); // Limit to prevent timeout

    if (otherIntentsError) throw otherIntentsError;

    console.log(`[Match] Found ${otherIntents?.length || 0} other intents to compare`);
    
    const matchesCreated: string[] = [];
    let pairsCompared = 0;

    // Compare each of my intents with other intents
    for (const myIntent of myIntents) {
      for (const otherIntent of otherIntents || []) {
        // Check if match already exists
        const { data: existingMatch } = await supabase
          .from('matches')
          .select('id')
          .or(`and(intent_a_id.eq.${myIntent.id},intent_b_id.eq.${otherIntent.id}),and(intent_a_id.eq.${otherIntent.id},intent_b_id.eq.${myIntent.id})`)
          .single();

        if (existingMatch) {
          console.log(`[Match] Already exists between ${myIntent.id} and ${otherIntent.id}`);
          continue;
        }

        // Calculate match score using AI
        let matchScore = 0;
        let matchReason = '';

        console.log(`[Match] Comparing: ${myIntent.profile?.display_name} (${myIntent.category}) vs ${otherIntent.profile?.display_name} (${otherIntent.category})`);
        
        try {
          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-lite',
              messages: [
                {
                  role: 'system',
                  content: `You are a matching algorithm. Analyze two user intents and return JSON: {"score": 0-1, "reason": "brief explanation"}`
                },
                {
                  role: 'user',
                  content: `Intent A: ${myIntent.category} - ${myIntent.description}
Intent B: ${otherIntent.category} - ${otherIntent.description}
Return JSON with score and reason.`
                }
              ],
              max_completion_tokens: 150,
              response_format: { type: 'json_object' }
            })
          });

          if (response.ok) {
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;
            if (content) {
              const parsed = JSON.parse(content);
              matchScore = parsed.score || 0;
              matchReason = parsed.reason || '';
            }
          } else {
            throw new Error(`AI returned ${response.status}`);
          }
        } catch (e) {
          console.error('[Match] AI matching failed, using fallback:', e);
          // Fallback: basic category matching
          if (myIntent.category === otherIntent.category) {
            matchScore = 0.6;
            matchReason = `Both looking for ${myIntent.category} connections`;
          } else {
            matchScore = 0.35;
            matchReason = 'Potential cross-category connection';
          }
        }
        
        console.log(`[Match] Score: ${matchScore}, reason: ${matchReason}`);
        pairsCompared++;
        
        // Create match if score is above threshold
        if (matchScore >= 0.3) {
          const { data: newMatch, error: matchError } = await supabase
            .from('matches')
            .insert({
              intent_a_id: myIntent.id,
              intent_b_id: otherIntent.id,
              profile_a_id: myIntent.profile_id,
              profile_b_id: otherIntent.profile_id,
              match_score: matchScore,
              match_reason: matchReason,
              status: 'pending_a'
            })
            .select()
            .single();

          if (matchError) {
            console.error(`[Match] Failed to create: ${matchError.message}`);
          } else if (newMatch) {
            console.log(`[Match] Created ${newMatch.id}`);
            matchesCreated.push(newMatch.id);
          }
        }
      }
    }

    console.log(`[Match] Done: ${pairsCompared} pairs, ${matchesCreated.length} new matches`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        pairs_compared: pairsCompared,
        matches_created: matchesCreated.length,
        match_ids: matchesCreated
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Match finding error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
