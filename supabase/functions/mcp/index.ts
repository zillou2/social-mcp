// deno-lint-ignore-file no-explicit-any
/**
 * Social MCP Server - Streamable HTTP Transport
 * 
 * Implements MCP protocol for serverless (Supabase Edge Functions)
 * Compatible with both legacy SSE (2024-11-05) and modern Streamable HTTP (2025-03-26)
 * 
 * Key insight: In stateless mode, POST responses are returned directly in the HTTP response
 * rather than pushed over an SSE stream.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateMcpApiKey, generateApiKey } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-mcp-api-key, cache-control, mcp-session-id, accept',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Expose-Headers': 'mcp-session-id',
};

// Tool definitions
const TOOLS = [
  {
    name: 'social_register',
    description: 'Register a new Social MCP profile. Use social_login instead if you have registered before.',
    inputSchema: {
      type: 'object',
      properties: {
        display_name: { type: 'string', description: 'Your display name' },
        bio: { type: 'string', description: 'A brief bio about yourself' },
        location: { type: 'string', description: 'Your location (optional)' },
      },
      required: ['display_name', 'bio'],
    },
  },
  {
    name: 'social_login',
    description: 'Log in to your existing Social MCP profile. Use this if you have registered before but are in a new session. You can login by display_name or profile_id.',
    inputSchema: {
      type: 'object',
      properties: {
        display_name: { type: 'string', description: 'Your display name (case-insensitive)' },
        profile_id: { type: 'string', description: 'Your profile ID (if you know it)' },
      },
    },
  },
  {
    name: 'social_whoami',
    description: 'Check if you are currently logged in and see your profile info.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'social_set_intent',
    description: 'Set what kind of connections you are looking for. Requires login first.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['professional', 'romance', 'friendship', 'expertise', 'sports', 'learning', 'other'],
          description: 'The category of connection',
        },
        description: { type: 'string', description: 'What you are looking for' },
        criteria: { type: 'object', description: 'Additional criteria (optional)' },
      },
      required: ['category', 'description'],
    },
  },
  {
    name: 'social_get_intents',
    description: 'Get your current active intents. Requires login first.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'social_get_matches',
    description: 'Get your current matches and pending introductions. Requires login first.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'social_respond_match',
    description: 'Accept or reject a match introduction. Requires login first.',
    inputSchema: {
      type: 'object',
      properties: {
        match_id: { type: 'string', description: 'The match ID' },
        action: { type: 'string', enum: ['accept', 'reject'], description: 'Accept or reject' },
      },
      required: ['match_id', 'action'],
    },
  },
  {
    name: 'social_send_message',
    description: 'Send a message to a matched user. Requires login first.',
    inputSchema: {
      type: 'object',
      properties: {
        match_id: { type: 'string', description: 'The match ID' },
        content: { type: 'string', description: 'Your message' },
      },
      required: ['match_id', 'content'],
    },
  },
  {
    name: 'social_get_messages',
    description: 'Get chat history with a matched user. **TIP**: Call this or social_get_notifications periodically to check for new messages. Requires login first.',
    inputSchema: {
      type: 'object',
      properties: {
        match_id: { type: 'string', description: 'The match ID' },
      },
      required: ['match_id'],
    },
  },
  {
    name: 'social_get_notifications',
    description: 'Check for new notifications (new matches, messages, etc.). **IMPORTANT**: Call this periodically during conversations to check for incoming messages. Requires login first.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'social_find_matches',
    description: 'Manually trigger the matching algorithm to find new matches based on current intents. The system runs this automatically, but you can trigger it manually to check immediately.',
    inputSchema: { type: 'object', properties: {} },
  },
];

// Session context passed through tool calls
interface SessionContext {
  sessionId: string;
  supabase: any;
}

// Handle tool calls
async function handleToolCall(
  toolName: string,
  toolArgs: Record<string, any>,
  profileId: string | null,
  supabase: any,
  sessionContext?: SessionContext
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean; newProfileId?: string }> {
  
  switch (toolName) {
    case 'social_register': {
      const mcpClientId = `mcp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({
          mcp_client_id: mcpClientId,
          display_name: toolArgs.display_name,
          bio: toolArgs.bio,
          location: toolArgs.location,
        })
        .select('id')
        .single();

      if (error || !newProfile) throw new Error(`Failed to create profile: ${error?.message}`);
      const newProfileId = newProfile.id;

      const { apiKey: newApiKey, keyHash } = await generateApiKey();
      
      await supabase.from('mcp_api_keys').insert({
        profile_id: newProfileId,
        key_hash: keyHash,
        name: 'MCP Client Key',
      });

      // Associate session with this profile for session-based auth
      if (sessionContext?.sessionId) {
        await supabase.from('mcp_sessions').upsert({
          session_id: sessionContext.sessionId,
          profile_id: newProfileId,
          last_used_at: new Date().toISOString(),
        }, { onConflict: 'session_id' });
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Profile registered!\n\nProfile ID: ${newProfileId}\nDisplay Name: ${toolArgs.display_name}\n\nYour session is now authenticated. You can use all social-mcp features.\n\n💡 Tip: Use social_set_intent to set what you're looking for.`,
        }],
        newProfileId,
      };
    }

    case 'social_login': {
      // Find profile by display_name or profile_id
      let profile = null;
      
      if (toolArgs.profile_id) {
        const { data } = await supabase
          .from('profiles')
          .select('id, display_name, bio, location')
          .eq('id', toolArgs.profile_id)
          .single();
        profile = data;
      } else if (toolArgs.display_name) {
        // Use order + limit to handle multiple profiles with same name (get most recent)
        const { data } = await supabase
          .from('profiles')
          .select('id, display_name, bio, location')
          .ilike('display_name', toolArgs.display_name)
          .order('created_at', { ascending: false })
          .limit(1);
        profile = data?.[0] || null;
      }

      if (!profile) {
        return {
          content: [{
            type: 'text',
            text: '❌ Profile not found. Please check your display name or profile ID, or use social_register to create a new profile.',
          }],
          isError: true,
        };
      }

      // Associate this session with the profile
      if (sessionContext?.sessionId) {
        await supabase.from('mcp_sessions').upsert({
          session_id: sessionContext.sessionId,
          profile_id: profile.id,
          last_used_at: new Date().toISOString(),
        }, { onConflict: 'session_id' });
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Logged in!\n\nWelcome back, ${profile.display_name}!\nProfile ID: ${profile.id}\nBio: ${profile.bio}\nLocation: ${profile.location || 'Not set'}\n\nYou can now use all social-mcp features.`,
        }],
        newProfileId: profile.id,
      };
    }

    case 'social_whoami': {
      if (!profileId) {
        return {
          content: [{
            type: 'text',
            text: '❓ Not logged in.\n\nUse social_login with your display_name to log in, or social_register to create a new profile.',
          }],
        };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, bio, location, created_at')
        .eq('id', profileId)
        .single();

      if (!profile) {
        return {
          content: [{
            type: 'text',
            text: '❌ Profile not found. Your session may be invalid.',
          }],
          isError: true,
        };
      }

      return {
        content: [{
          type: 'text',
          text: `👤 You are logged in as:\n\nDisplay Name: ${profile.display_name}\nProfile ID: ${profile.id}\nBio: ${profile.bio}\nLocation: ${profile.location || 'Not set'}\nMember since: ${new Date(profile.created_at).toLocaleDateString()}`,
        }],
      };
    }

    case 'social_set_intent': {
      if (!profileId) {
        return { content: [{ type: 'text', text: '❌ Not logged in. Use social_login with your display_name first.' }], isError: true };
      }

      const { data: newIntent, error } = await supabase.from('intents').insert({
        profile_id: profileId,
        category: toolArgs.category,
        description: toolArgs.description,
        criteria: toolArgs.criteria || {},
      }).select().single();

      if (error) throw new Error(`Failed to create intent: ${error.message}`);

      // Auto-trigger matching to find immediate matches
      let matchesFound = 0;
      const { data: otherIntents } = await supabase
        .from('intents')
        .select('*, profile:profiles(*)')
        .eq('is_active', true)
        .eq('category', toolArgs.category)
        .neq('profile_id', profileId);

      if (otherIntents?.length) {
        for (const otherIntent of otherIntents) {
          // Check if match already exists
          const { data: existingMatch } = await supabase
            .from('matches')
            .select('id')
            .or(`and(intent_a_id.eq.${newIntent.id},intent_b_id.eq.${otherIntent.id}),and(intent_a_id.eq.${otherIntent.id},intent_b_id.eq.${newIntent.id})`)
            .limit(1);

          if (existingMatch?.length) continue;

          // Create match for same category
          const { error: matchError } = await supabase
            .from('matches')
            .insert({
              intent_a_id: newIntent.id,
              intent_b_id: otherIntent.id,
              profile_a_id: profileId,
              profile_b_id: otherIntent.profile_id,
              match_score: 0.6,
              match_reason: `Both looking for ${toolArgs.category} connections`,
              status: 'pending_a'
            });

          if (!matchError) matchesFound++;
        }
      }

      const matchMsg = matchesFound > 0 
        ? `\n\n🎉 Found ${matchesFound} potential match(es)! Use social_get_matches to see them.`
        : '';

      return {
        content: [{
          type: 'text',
          text: `✅ Intent created!\n\nCategory: ${toolArgs.category}\nDescription: ${toolArgs.description}${matchMsg}`,
        }],
      };
    }

    case 'social_get_intents': {
      if (!profileId) {
        return { content: [{ type: 'text', text: '❌ Not logged in. Use social_login with your display_name first.' }], isError: true };
      }

      const { data: intents, error } = await supabase
        .from('intents')
        .select('*')
        .eq('profile_id', profileId)
        .eq('is_active', true);

      if (error) throw new Error(`Failed to get intents: ${error.message}`);

      if (!intents?.length) {
        return { content: [{ type: 'text', text: 'No active intents. Use social_set_intent to create one.' }] };
      }
      const list = intents.map((i: any) => `• ${i.category}: ${i.description}`).join('\n');
      return { content: [{ type: 'text', text: `📋 Your intents:\n\n${list}` }] };
    }

    case 'social_get_matches': {
      if (!profileId) {
        return { content: [{ type: 'text', text: '❌ Not logged in. Use social_login with your display_name first.' }], isError: true };
      }

      const { data: matches, error } = await supabase
        .from('matches')
        .select(`*, profile_a:profiles!matches_profile_a_id_fkey(id, display_name, bio), profile_b:profiles!matches_profile_b_id_fkey(id, display_name, bio), intent_a:intents!matches_intent_a_id_fkey(category, description), intent_b:intents!matches_intent_b_id_fkey(category, description)`)
        .or(`profile_a_id.eq.${profileId},profile_b_id.eq.${profileId}`);

      if (error) throw new Error(`Failed to get matches: ${error.message}`);

      if (!matches?.length) {
        return { content: [{ type: 'text', text: 'No matches yet. Keep your intents active!' }] };
      }
      
      const list = matches.map((m: any) => {
        const isA = m.profile_a_id === profileId;
        const otherProfile = isA ? m.profile_b : m.profile_a;
        const theirIntent = isA ? m.intent_b : m.intent_a;
        const score = Math.round(m.match_score * 100);
        const statusEmoji = m.status === 'accepted' ? '🟢' : '🟡';
        return `• **${otherProfile.display_name}** (${score}% match)\n  ${theirIntent.description}\n  Status: ${statusEmoji} ${m.status} | ID: ${m.id}`;
      }).join('\n\n');

      return { content: [{ type: 'text', text: `🤝 Matches:\n\n${list}` }] };
    }

    case 'social_respond_match': {
      if (!profileId) {
        return { content: [{ type: 'text', text: '❌ Not logged in. Use social_login with your display_name first.' }], isError: true };
      }

      const { data: match, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', toolArgs.match_id)
        .single();

      if (fetchError || !match) {
        return { content: [{ type: 'text', text: '❌ Match not found' }], isError: true };
      }

      const isA = match.profile_a_id === profileId;
      const isB = match.profile_b_id === profileId;

      if (!isA && !isB) {
        return { content: [{ type: 'text', text: '❌ Not authorized for this match' }], isError: true };
      }
      
      if (toolArgs.action === 'reject') {
        await supabase.from('matches').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', toolArgs.match_id);
        return { content: [{ type: 'text', text: '❌ Match rejected.' }] };
      }

      // Handle accept with proper status transitions
      const now = new Date().toISOString();
      const updateData: Record<string, unknown> = { updated_at: now };
      let newStatus = match.status;
      let message = '';

      if (isA && match.status === 'pending_a') {
        updateData.a_accepted_at = now;
        newStatus = 'pending_b';
        message = '✅ You accepted! Waiting for their response.';
      } else if (isB && match.status === 'pending_b') {
        updateData.b_accepted_at = now;
        newStatus = 'accepted';
        message = '✅ Match accepted! You can now message each other.';
      } else if (isA && match.status === 'pending_b') {
        message = '⏳ Already waiting for the other party to respond.';
      } else if (isB && match.status === 'pending_a') {
        message = '⏳ Waiting for them to see and respond to your match first.';
      } else if (match.status === 'accepted') {
        message = '✅ Already connected! Use social_send_message to chat.';
      } else {
        message = `⚠️ Cannot accept (status: ${match.status})`;
      }

      if (newStatus !== match.status) {
        updateData.status = newStatus;
        await supabase.from('matches').update(updateData).eq('id', toolArgs.match_id);
      }

      return { content: [{ type: 'text', text: message }] };
    }

    case 'social_send_message': {
      if (!profileId) {
        return { content: [{ type: 'text', text: '❌ Not logged in. Use social_login with your display_name first.' }], isError: true };
      }

      // Verify match exists and is accepted
      const { data: msgMatch, error: msgMatchError } = await supabase
        .from('matches')
        .select('status, profile_a_id, profile_b_id')
        .eq('id', toolArgs.match_id)
        .single();

      if (msgMatchError || !msgMatch) {
        return { content: [{ type: 'text', text: '❌ Match not found' }], isError: true };
      }

      if (msgMatch.status !== 'accepted') {
        return { content: [{ type: 'text', text: '❌ Cannot message until both parties accept the match. Use social_respond_match to accept first.' }], isError: true };
      }

      if (msgMatch.profile_a_id !== profileId && msgMatch.profile_b_id !== profileId) {
        return { content: [{ type: 'text', text: '❌ Not authorized for this match' }], isError: true };
      }

      const { error } = await supabase.from('messages').insert({
        match_id: toolArgs.match_id,
        sender_profile_id: profileId,
        content: toolArgs.content,
        message_type: 'text',
      });

      if (error) throw new Error(`Failed to send message: ${error.message}`);
      return { content: [{ type: 'text', text: '✉️ Message sent!\n\n💡 The recipient will see this when they check notifications (social_get_notifications) or messages (social_get_messages).' }] };
    }

    case 'social_get_messages': {
      if (!profileId) {
        return { content: [{ type: 'text', text: '❌ Not logged in. Use social_login with your display_name first.' }], isError: true };
      }

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_profile_id_fkey(display_name)')
        .eq('match_id', toolArgs.match_id)
        .order('created_at', { ascending: true });

      if (error) throw new Error(`Failed to get messages: ${error.message}`);

      if (!messages?.length) {
        return { content: [{ type: 'text', text: 'No messages yet. Start the conversation!' }] };
      }
      const list = messages.map((m: any) => 
        `**${m.sender_profile_id === profileId ? 'You' : m.sender.display_name}**: ${m.content}`
      ).join('\n');
      return { content: [{ type: 'text', text: `💬 Chat:\n\n${list}` }] };
    }

    case 'social_get_notifications': {
      if (!profileId) {
        return { content: [{ type: 'text', text: '❌ Not logged in. Use social_login with your display_name first.' }], isError: true };
      }

      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', profileId)
        .eq('is_delivered', false)
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Failed to get notifications: ${error.message}`);

      if (notifications?.length) {
        await supabase
          .from('notifications')
          .update({ is_delivered: true, delivered_at: new Date().toISOString() })
          .in('id', notifications.map((n: any) => n.id));
      }

      if (!notifications?.length) {
        return { content: [{ type: 'text', text: '📭 No new notifications.' }] };
      }
      const list = notifications.map((n: any) => {
        const icon = n.notification_type === 'new_match' ? '🎉' : 
                    n.notification_type === 'match_accepted' ? '🤝' : 
                    n.notification_type === 'new_message' ? '💬' : '📢';
        return `${icon} ${n.notification_type.replace(/_/g, ' ')}`;
      }).join('\n');

      return { content: [{ type: 'text', text: `🔔 Notifications:\n\n${list}` }] };
    }

    case 'social_find_matches': {
      // Trigger the matching algorithm inline
      const { data: intents, error: intentsError } = await supabase
        .from('intents')
        .select('*, profile:profiles(*)')
        .eq('is_active', true);

      if (intentsError) throw new Error(`Failed to get intents: ${intentsError.message}`);

      let matchesCreated = 0;

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
            .limit(1);

          if (existingMatch?.length) continue;

          // Calculate match score - use category matching as reliable baseline
          let matchScore = 0;
          let matchReason = '';

          // Same category = strong match potential
          if (intentA.category === intentB.category) {
            matchScore = 0.6;
            matchReason = `Both looking for ${intentA.category} connections`;
          }

          // Create match if score is above threshold
          if (matchScore >= 0.3) {
            const { error: matchError } = await supabase
              .from('matches')
              .insert({
                intent_a_id: intentA.id,
                intent_b_id: intentB.id,
                profile_a_id: intentA.profile_id,
                profile_b_id: intentB.profile_id,
                match_score: matchScore,
                match_reason: matchReason,
                status: 'pending_a'
              });

            if (!matchError) {
              matchesCreated++;
            }
          }
        }
      }

      return {
        content: [{
          type: 'text',
          text: matchesCreated > 0 
            ? `🔍 Matching complete! Created ${matchesCreated} new match(es). Use social_get_matches to see them.`
            : '🔍 Matching complete. No new matches found at this time.',
        }],
      };
    }

    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${toolName}` }], isError: true };
  }
}

// Process JSON-RPC request
async function processJsonRpc(
  message: any,
  supabase: any,
  profileId: string | null,
  sessionId: string
): Promise<any> {
  const { jsonrpc, id, method, params } = message;

  if (jsonrpc !== '2.0') {
    return { jsonrpc: '2.0', id, error: { code: -32600, message: 'Invalid Request' } };
  }

  // Session context for tool calls
  const sessionContext: SessionContext = { sessionId, supabase };

  try {
    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'social-mcp', version: '1.0.0' },
          },
        };

      case 'initialized':
        return { jsonrpc: '2.0', id, result: {} };

      case 'tools/list':
        return { jsonrpc: '2.0', id, result: { tools: TOOLS } };

      case 'tools/call': {
        const { name, arguments: args } = params || {};
        const result = await handleToolCall(name, args || {}, profileId, supabase, sessionContext);
        return { jsonrpc: '2.0', id, result };
      }

      case 'resources/list':
        return { jsonrpc: '2.0', id, result: { resources: [] } };

      case 'prompts/list':
        return { jsonrpc: '2.0', id, result: { prompts: [] } };

      case 'notifications/list':
        return { jsonrpc: '2.0', id, result: { notifications: [] } };

      case 'ping':
        return { jsonrpc: '2.0', id, result: {} };

      default:
        return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
    }
  } catch (error) {
    console.error('JSON-RPC error:', error);
    return {
      jsonrpc: '2.0',
      id,
      error: { code: -32603, message: error instanceof Error ? error.message : 'Internal error' },
    };
  }
}

// Main server handler
Deno.serve(async (req) => {
  const url = new URL(req.url);
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Session management
  const incomingSessionId = req.headers.get('mcp-session-id');
  const sessionId = incomingSessionId || crypto.randomUUID();

  // Try to get profile ID from multiple sources
  let profileId: string | null = null;
  
  // 1. First try API key auth (legacy)
  const apiKey = req.headers.get('x-mcp-api-key');
  if (apiKey) {
    const validation = await validateMcpApiKey(apiKey);
    if (validation.valid) profileId = validation.profileId || null;
  }
  
  // 2. If no API key, try session-based auth
  if (!profileId && incomingSessionId) {
    const { data: session } = await supabase
      .from('mcp_sessions')
      .select('profile_id')
      .eq('session_id', incomingSessionId)
      .single();
    
    if (session?.profile_id) {
      profileId = session.profile_id;
      // Update last_used_at
      await supabase
        .from('mcp_sessions')
        .update({ last_used_at: new Date().toISOString() })
        .eq('session_id', incomingSessionId);
    }
  }
  
  console.log(`Session: ${sessionId}, Profile: ${profileId || 'none'}`);

  // ============================================================
  // GET: SSE stream for legacy clients (2024-11-05 spec)
  // Returns "endpoint" event pointing to this same URL for POSTs
  // ============================================================
  if (req.method === 'GET') {
    const encoder = new TextEncoder();
    
    // The endpoint event tells the client where to POST
    // We point it to the same URL (this endpoint handles both)
    const endpointUrl = url.href;
    
    // Create SSE response with endpoint event
    const sseBody = `event: endpoint\ndata: ${endpointUrl}\n\n`;
    
    return new Response(encoder.encode(sseBody), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Mcp-Session-Id': sessionId,
      },
    });
  }

  // ============================================================
  // POST: JSON-RPC handler
  // Returns response directly (Streamable HTTP / stateless mode)
  // ============================================================
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log('MCP Request:', JSON.stringify(body));

      const response = await processJsonRpc(body, supabase, profileId, sessionId);
      console.log('MCP Response:', JSON.stringify(response));

      return new Response(JSON.stringify(response), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Mcp-Session-Id': sessionId,
        },
      });
    } catch (error) {
      console.error('Request error:', error);
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error' },
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // DELETE: Session termination
  if (req.method === 'DELETE') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
