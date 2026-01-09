import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { generateApiKey } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { mcp_client_id, display_name, bio, location, profile_data, profile_id: inputProfileId, login_only } = await req.json();

    let profileId: string;
    let profileDisplayName: string;

    // Login mode: find existing profile by display_name or profile_id
    if (login_only) {
      let existingProfile;
      
      if (inputProfileId) {
        const { data } = await supabase
          .from('profiles')
          .select('id, display_name')
          .eq('id', inputProfileId)
          .single();
        existingProfile = data;
      } else if (display_name) {
        const { data } = await supabase
          .from('profiles')
          .select('id, display_name')
          .ilike('display_name', display_name)
          .single();
        existingProfile = data;
      }
      
      if (!existingProfile) {
        return new Response(
          JSON.stringify({ error: 'Profile not found. Please register first.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      profileId = existingProfile.id;
      profileDisplayName = existingProfile.display_name;
      
      // Update last seen
      await supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', profileId);
    } else {
      // Registration mode
      if (!mcp_client_id) {
        return new Response(
          JSON.stringify({ error: 'mcp_client_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if profile already exists by mcp_client_id
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('mcp_client_id', mcp_client_id)
        .single();

      if (existingProfile) {
        // Update existing profile
        const { data: updated, error } = await supabase
          .from('profiles')
          .update({
            display_name,
            bio,
            location,
            profile_data: profile_data || {},
            last_seen_at: new Date().toISOString()
          })
          .eq('id', existingProfile.id)
          .select()
          .single();

        if (error) throw error;
        profileId = updated.id;
        profileDisplayName = updated.display_name;
      } else {
        // Create new profile
        const { data: newProfile, error } = await supabase
          .from('profiles')
          .insert({
            mcp_client_id,
            display_name,
            bio,
            location,
            profile_data: profile_data || {}
          })
          .select()
          .single();

        if (error) throw error;
        profileId = newProfile.id;
        profileDisplayName = newProfile.display_name;
      }
    }

    // Generate new API key for this session
    const { apiKey, keyHash } = await generateApiKey();

    // Store the key hash
    await supabase
      .from('mcp_api_keys')
      .insert({
        key_hash: keyHash,
        profile_id: profileId,
        name: `MCP Session - ${new Date().toISOString()}`
      });

    return new Response(
      JSON.stringify({
        success: true,
        profile_id: profileId,
        display_name: profileDisplayName,
        api_key: apiKey,
        message: login_only ? 'Logged in successfully.' : 'Profile registered successfully. Use this API key for subsequent requests.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
