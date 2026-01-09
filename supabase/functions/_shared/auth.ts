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
