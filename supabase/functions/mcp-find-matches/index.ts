import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// This function runs on a schedule or can be triggered to find matches
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get all active intents
    const { data: intents, error: intentsError } = await supabase
      .from('intents')
      .select('*, profile:profiles(*)')
      .eq('is_active', true);

    if (intentsError) throw intentsError;

    const matchesCreated: string[] = [];

    // Compare each intent with others
    for (let i = 0; i < intents.length; i++) {
      for (let j = i + 1; j < intents.length; j++) {
        const intentA = intents[i];
        const intentB = intents[j];

        // Skip if same profile
        if (intentA.profile_id === intentB.profile_id) continue;

        // Check if match already exists
        const { data: existingMatch } = await supabase
          .from('matches')
          .select('id')
          .or(`and(intent_a_id.eq.${intentA.id},intent_b_id.eq.${intentB.id}),and(intent_a_id.eq.${intentB.id},intent_b_id.eq.${intentA.id})`)
          .single();

        if (existingMatch) continue;

        // Calculate match score using AI
        let matchScore = 0;
        let matchReason = '';

        try {
          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.0-flash-001',
              messages: [
                {
                  role: 'system',
                  content: `You are a matching algorithm for a social network. Analyze two user intents and determine if they would be a good match.
                  
Return a JSON object with:
- score: number between 0 and 1 (1 = perfect match)
- reason: brief explanation why they match or don't match

Consider:
- Complementary needs (e.g., jobseeker + employer)
- Similar interests for friendship/sports
- Location compatibility
- Intent alignment`
                },
                {
                  role: 'user',
                  content: `Intent A:
Category: ${intentA.category}
Description: ${intentA.description}
Criteria: ${JSON.stringify(intentA.criteria)}
Profile: ${intentA.profile?.display_name || 'Anonymous'}, ${intentA.profile?.bio || 'No bio'}

Intent B:
Category: ${intentB.category}
Description: ${intentB.description}
Criteria: ${JSON.stringify(intentB.criteria)}
Profile: ${intentB.profile?.display_name || 'Anonymous'}, ${intentB.profile?.bio || 'No bio'}

Analyze and return JSON.`
                }
              ],
              max_completion_tokens: 500,
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
          }
        } catch (e) {
          console.error('AI matching failed:', e);
          // Fallback: basic category matching
          if (intentA.category === intentB.category) {
            matchScore = 0.5;
            matchReason = 'Same category intent';
          } else if (
            (intentA.category === 'professional' && intentB.category === 'professional') ||
            (intentA.category === 'friendship' && intentB.category === 'friendship')
          ) {
            matchScore = 0.4;
            matchReason = 'Related intent categories';
          }
        }

        // Create match if score is above threshold
        if (matchScore >= 0.3) {
          const { data: newMatch, error: matchError } = await supabase
            .from('matches')
            .insert({
              intent_a_id: intentA.id,
              intent_b_id: intentB.id,
              profile_a_id: intentA.profile_id,
              profile_b_id: intentB.profile_id,
              match_score: matchScore,
              match_reason: matchReason,
              status: 'pending_a'
            })
            .select()
            .single();

          if (!matchError && newMatch) {
            matchesCreated.push(newMatch.id);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
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
