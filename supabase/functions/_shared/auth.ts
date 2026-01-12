import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function validateMcpApiKey(apiKey: string): Promise<{ valid: boolean; profileId?: string }> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Hash the API key for comparison
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const { data: keyData, error } = await supabase
    .from('mcp_api_keys')
    .select('id, profile_id, is_active, scopes')
    .eq('key_hash', keyHash)
    .single();

  if (error || !keyData || !keyData.is_active) {
    return { valid: false };
  }

  // Update last used timestamp
  await supabase
    .from('mcp_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyData.id);

  return { valid: true, profileId: keyData.profile_id };
}

export async function generateApiKey(): Promise<{ apiKey: string; keyHash: string }> {
  // Generate a random API key
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const apiKey = 'smcp_' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');

  // Hash the API key for storage
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return { apiKey, keyHash };
}

/**
 * Validates profile ID directly (for session-based auth fallback)
 * This is used when API key auth fails but we have a profile_id header
 */
export async function validateProfileId(profileId: string): Promise<{ valid: boolean; profileId?: string }> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Check if profile exists and is active
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, is_active')
    .eq('id', profileId)
    .single();

  if (error || !profile || !profile.is_active) {
    return { valid: false };
  }

  return { valid: true, profileId: profile.id };
}

/**
 * Authenticate request using API key or profile_id header
 * Returns profileId if valid, null otherwise
 */
export async function authenticateRequest(req: Request): Promise<string | null> {
  // First try API key
  const apiKey = req.headers.get('x-mcp-api-key');
  if (apiKey) {
    const { valid, profileId } = await validateMcpApiKey(apiKey);
    if (valid && profileId) return profileId;
  }
  
  // Fallback to profile_id header (for clients with session issues like Claude Web)
  const profileIdHeader = req.headers.get('x-mcp-profile-id');
  if (profileIdHeader) {
    const { valid, profileId } = await validateProfileId(profileIdHeader);
    if (valid && profileId) return profileId;
  }
  
  return null;
}
