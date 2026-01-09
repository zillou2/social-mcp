import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { validateMcpApiKey } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get('x-mcp-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { valid, profileId } = await validateMcpApiKey(apiKey);
    if (!valid || !profileId) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (req.method === 'GET') {
      // Get all intents for this profile
      const { data: intents, error } = await supabase
        .from('intents')
        .select('*')
        .eq('profile_id', profileId)
        .eq('is_active', true);

      if (error) throw error;

      return new Response(
        JSON.stringify({ intents }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const { category, description, criteria } = await req.json();

      if (!category || !description) {
        return new Response(
          JSON.stringify({ error: 'category and description are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate embedding for the intent description using Lovable AI
      let embedding = null;
      try {
        const embeddingResponse = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai/text-embedding-3-small',
            input: `${category}: ${description}. ${JSON.stringify(criteria || {})}`
          })
        });
        
        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json();
          embedding = embeddingData.data?.[0]?.embedding;
        }
      } catch (e) {
        console.log('Embedding generation failed, continuing without:', e);
      }

      const { data: intent, error } = await supabase
        .from('intents')
        .insert({
          profile_id: profileId,
          category,
          description,
          criteria: criteria || {},
          embedding
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ 
          success: true, 
          intent,
          message: 'Intent created. Matching will begin automatically.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const intentId = url.searchParams.get('intent_id');

      if (!intentId) {
        return new Response(
          JSON.stringify({ error: 'intent_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('intents')
        .update({ is_active: false })
        .eq('id', intentId)
        .eq('profile_id', profileId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: 'Intent deactivated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Intent error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
