// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateMcpApiKey, generateApiKey } from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-mcp-api-key, cache-control',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Store for pending responses (in-memory, works for single instance)
const pendingResponses = new Map<string, (response: unknown) => void>();

// Process JSON-RPC request
async function processRequest(body: unknown, supabase: any, apiKey: string | null) {
  const { jsonrpc, id, method, params } = body as { jsonrpc: string; id: unknown; method: string; params?: Record<string, unknown> };

  if (jsonrpc !== '2.0') {
    return {
      jsonrpc: '2.0',
      id,
      error: { code: -32600, message: 'Invalid Request: must use JSON-RPC 2.0' }
    };
  }

  // Validate API key for authenticated requests
  let profileId: string | null = null;
  if (apiKey) {
    const validation = await validateMcpApiKey(apiKey);
    if (validation.valid) {
      profileId = validation.profileId || null;
    }
  }

  let result: unknown;

  try {
    switch (method) {
      case 'initialize':
        result = {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'social-mcp',
            version: '1.0.0',
          },
        };
        break;

      case 'initialized':
        // Client acknowledgment - no response needed
        result = {};
        break;

      case 'tools/list':
        result = {
          tools: [
            {
              name: 'social_register',
              description: 'Register or update your Social MCP profile. Required before using other features. Returns an API key for future requests.',
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
              name: 'social_set_intent',
              description: 'Set what kind of connections you are looking for. Requires registration first.',
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
              description: 'Get your current active intents. Requires registration first.',
              inputSchema: { type: 'object', properties: {} },
            },
            {
              name: 'social_get_matches',
              description: 'Get your current matches and pending introductions. Requires registration first.',
              inputSchema: { type: 'object', properties: {} },
            },
            {
              name: 'social_respond_match',
              description: 'Accept or reject a match introduction. Requires registration first.',
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
              description: 'Send a message to a matched user. Requires registration first.',
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
              description: 'Get chat history with a matched user. Requires registration first.',
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
              description: 'Check for new notifications. Requires registration first.',
              inputSchema: { type: 'object', properties: {} },
            },
          ],
        };
        break;

      case 'tools/call':
        result = await handleToolCall(params as { name: string; arguments?: Record<string, any> }, profileId, supabase);
        break;

      case 'notifications/list':
        result = { notifications: [] };
        break;

      case 'resources/list':
        result = { resources: [] };
        break;

      case 'prompts/list':
        result = { prompts: [] };
        break;

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` }
        };
    }

    return { jsonrpc: '2.0', id, result };
  } catch (error) {
    console.error('MCP Error:', error);
    return {
      jsonrpc: '2.0',
      id,
      error: { code: -32603, message: error instanceof Error ? error.message : 'Internal error' }
    };
  }
}

// Handle tool calls
async function handleToolCall(
  params: { name: string; arguments?: Record<string, any> },
  profileId: string | null,
  supabase: any
): Promise<any> {
  const toolName = params.name;
  const toolArgs: any = params.arguments || {};

  switch (toolName) {
    case 'social_register': {
      const mcpClientId = `mcp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Create new profile
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

      // Generate API key
      const { apiKey: newApiKey, keyHash } = await generateApiKey();
      
      await supabase
        .from('mcp_api_keys')
        .insert({
          profile_id: newProfileId,
          key_hash: keyHash,
          name: 'MCP Client Key',
        });

      return {
        content: [{
          type: 'text',
          text: `✅ Profile registered!\n\nProfile ID: ${newProfileId}\nAPI Key: ${newApiKey}\n\n⚠️ Save this API key - you'll need it for future requests.\nPass it in the x-mcp-api-key header.\n\nYou can now use social_set_intent to set what you're looking for.`,
        }],
      };
    }

    case 'social_set_intent': {
      if (!profileId) {
        return { content: [{ type: 'text', text: '❌ Please register first using social_register, then include your API key in the x-mcp-api-key header.' }], isError: true };
      }

      const { error } = await supabase
        .from('intents')
        .insert({
          profile_id: profileId,
          category: toolArgs.category,
          description: toolArgs.description,
          criteria: toolArgs.criteria || {},
        });

      if (error) throw new Error(`Failed to create intent: ${error.message}`);

      return {
        content: [{
          type: 'text',
          text: `✅ Intent created!\n\nCategory: ${toolArgs.category}\nDescription: ${toolArgs.description}\n\nThe system will now look for compatible matches.`,
        }],
      };
    }

    case 'social_get_intents': {
      if (!profileId) {
        return { content: [{ type: 'text', text: '❌ Please register first' }], isError: true };
      }

      const { data: intents, error } = await supabase
        .from('intents')
        .select('*')
        .eq('profile_id', profileId)
        .eq('is_active', true);

      if (error) throw new Error(`Failed to get intents: ${error.message}`);

      if (!intents?.length) {
        return { content: [{ type: 'text', text: 'No active intents. Use social_set_intent to create one.' }] };
      } else {
        const list = intents.map((i: any) => `• ${i.category}: ${i.description}`).join('\n');
        return { content: [{ type: 'text', text: `📋 Your intents:\n\n${list}` }] };
      }
    }

    case 'social_get_matches': {
      if (!profileId) {
        return { content: [{ type: 'text', text: '❌ Please register first' }], isError: true };
      }

      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          *,
          profile_a:profiles!matches_profile_a_id_fkey(id, display_name, bio),
          profile_b:profiles!matches_profile_b_id_fkey(id, display_name, bio),
          intent_a:intents!matches_intent_a_id_fkey(category, description),
          intent_b:intents!matches_intent_b_id_fkey(category, description)
        `)
        .or(`profile_a_id.eq.${profileId},profile_b_id.eq.${profileId}`);

      if (error) throw new Error(`Failed to get matches: ${error.message}`);

      if (!matches?.length) {
        return { content: [{ type: 'text', text: 'No matches yet. Keep your intents active!' }] };
      } else {
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
    }

    case 'social_respond_match': {
      if (!profileId) {
        return { content: [{ type: 'text', text: '❌ Please register first' }], isError: true };
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
      const updateField = isA ? 'a_accepted_at' : 'b_accepted_at';
      
      if (toolArgs.action === 'accept') {
        const updateData: Record<string, unknown> = {
          [updateField]: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const otherAccepted = isA ? match.b_accepted_at : match.a_accepted_at;
        if (otherAccepted) {
          updateData.status = 'accepted';
        }

        await supabase.from('matches').update(updateData).eq('id', toolArgs.match_id);
        return { content: [{ type: 'text', text: otherAccepted ? '✅ Match accepted! You can now message each other.' : '✅ You accepted! Waiting for their response.' }] };
      } else {
        await supabase.from('matches').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', toolArgs.match_id);
        return { content: [{ type: 'text', text: '❌ Match rejected.' }] };
      }
    }

    case 'social_send_message': {
      if (!profileId) {
        return { content: [{ type: 'text', text: '❌ Please register first' }], isError: true };
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          match_id: toolArgs.match_id,
          sender_profile_id: profileId,
          content: toolArgs.content,
          message_type: 'text',
        });

      if (error) throw new Error(`Failed to send message: ${error.message}`);
      return { content: [{ type: 'text', text: '✉️ Message sent!' }] };
    }

    case 'social_get_messages': {
      if (!profileId) {
        return { content: [{ type: 'text', text: '❌ Please register first' }], isError: true };
      }

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_profile_id_fkey(display_name)')
        .eq('match_id', toolArgs.match_id)
        .order('created_at', { ascending: true });

      if (error) throw new Error(`Failed to get messages: ${error.message}`);

      if (!messages?.length) {
        return { content: [{ type: 'text', text: 'No messages yet. Start the conversation!' }] };
      } else {
        const list = messages.map((m: any) => 
          `**${m.sender_profile_id === profileId ? 'You' : m.sender.display_name}**: ${m.content}`
        ).join('\n');
        return { content: [{ type: 'text', text: `💬 Chat:\n\n${list}` }] };
      }
    }

    case 'social_get_notifications': {
      if (!profileId) {
        return { content: [{ type: 'text', text: '❌ Please register first' }], isError: true };
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
      } else {
        const list = notifications.map((n: any) => {
          const icon = n.notification_type === 'new_match' ? '🎉' : 
                      n.notification_type === 'match_accepted' ? '🤝' : 
                      n.notification_type === 'new_message' ? '💬' : '📢';
          return `${icon} ${n.notification_type.replace(/_/g, ' ')}`;
        }).join('\n');

        return { content: [{ type: 'text', text: `🔔 Notifications:\n\n${list}` }] };
      }
    }

    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${toolName}` }], isError: true };
  }
}

// MCP Protocol Implementation over SSE
Deno.serve(async (req) => {
  const url = new URL(req.url);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const apiKey = req.headers.get('x-mcp-api-key');

  // SSE endpoint for MCP protocol (GET request initiates SSE stream)
  if (req.method === 'GET') {
    const encoder = new TextEncoder();
    
    // For MCP SSE transport, we need to:
    // 1. Send an "endpoint" event with the URL to POST to
    // 2. Keep the connection open for streaming responses
    
    // Generate a session ID for this connection
    const sessionId = crypto.randomUUID();
    const postEndpoint = `${url.origin}${url.pathname}?sessionId=${sessionId}`;
    
    let streamController: ReadableStreamDefaultController<Uint8Array>;
    let keepAliveInterval: number;
    
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        streamController = controller;
        
        // Send the endpoint event (tells client where to POST)
        controller.enqueue(encoder.encode(`event: endpoint\ndata: ${postEndpoint}\n\n`));
        
        // Register this session
        pendingResponses.set(sessionId, (response) => {
          try {
            controller.enqueue(encoder.encode(`event: message\ndata: ${JSON.stringify(response)}\n\n`));
          } catch (e) {
            console.error('Failed to send SSE message:', e);
          }
        });
        
        // Keep-alive ping every 15 seconds to prevent timeout
        keepAliveInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch {
            clearInterval(keepAliveInterval);
          }
        }, 15000);
      },
      cancel() {
        console.log('SSE connection closed for session:', sessionId);
        clearInterval(keepAliveInterval);
        pendingResponses.delete(sessionId);
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  // Handle JSON-RPC requests via POST
  if (req.method === 'POST') {
    const sessionId = url.searchParams.get('sessionId');
    
    try {
      const body = await req.json();
      console.log('Received MCP request:', JSON.stringify(body));
      
      const response = await processRequest(body, supabase, apiKey);
      console.log('Sending MCP response:', JSON.stringify(response));

      // If we have a session ID and a registered handler, send via SSE
      if (sessionId && pendingResponses.has(sessionId)) {
        const sendResponse = pendingResponses.get(sessionId)!;
        sendResponse(response);
        // Return accepted status for SSE mode
        return new Response('accepted', {
          status: 202,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }

      // Otherwise return response directly (for non-SSE clients or direct POST)
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('MCP Error:', error);
      const errorResponse = {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32603, message: error instanceof Error ? error.message : 'Internal error' }
      };
      
      return new Response(JSON.stringify(errorResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
