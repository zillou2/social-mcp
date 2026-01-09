#!/usr/bin/env node
/**
 * Social MCP HTTP Server with SSE Push Notifications
 * 
 * Deploy this to Railway, Fly.io, Render, or any Node.js host.
 * Provides real-time push via Server-Sent Events using Supabase Realtime.
 * 
 * Usage with Claude Desktop:
 * {
 *   "mcpServers": {
 *     "social-mcp": {
 *       "command": "npx",
 *       "args": ["mcp-remote", "https://your-deployed-server.com/mcp"]
 *     }
 *   }
 * }
 */

import http from 'http';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const PORT = parseInt(process.env.PORT || '3000');
const API_URL = process.env.SOCIAL_MCP_API_URL || 'https://cwaozizmiipxstlwmepk.supabase.co/functions/v1';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cwaozizmiipxstlwmepk.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3YW96aXptaWlweHN0bHdtZXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjY0MjMsImV4cCI6MjA4MzU0MjQyM30.QArs0EZmysGrPTrpMUSsUizkDav9uHZgCqOYF1Dva9w';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Session storage
interface Session {
  profileId: string | null;
  apiKey: string | null;
  sseResponse: http.ServerResponse | null;
  notificationsChannel: RealtimeChannel | null;
  messagesChannel: RealtimeChannel | null;
}

const sessions = new Map<string, Session>();

// Tool definitions
const TOOLS = [
  {
    name: 'social_register',
    description: 'Register a new Social MCP profile.',
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
    description: 'Log in to your existing Social MCP profile.',
    inputSchema: {
      type: 'object',
      properties: {
        display_name: { type: 'string', description: 'Your display name (case-insensitive)' },
        profile_id: { type: 'string', description: 'Your profile ID (if you know it)' },
      },
    },
  },
  {
    name: 'social_set_intent',
    description: 'Set what kind of connections you are looking for.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['professional', 'romance', 'friendship', 'expertise', 'sports', 'learning', 'other'],
        },
        description: { type: 'string', description: 'What you are looking for' },
      },
      required: ['category', 'description'],
    },
  },
  {
    name: 'social_get_intents',
    description: 'Get your current active intents.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'social_get_matches',
    description: 'Get your current matches and pending introductions.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'social_respond_match',
    description: 'Accept or reject a match introduction.',
    inputSchema: {
      type: 'object',
      properties: {
        match_id: { type: 'string' },
        action: { type: 'string', enum: ['accept', 'reject'] },
      },
      required: ['match_id', 'action'],
    },
  },
  {
    name: 'social_send_message',
    description: 'Send a message to a matched user.',
    inputSchema: {
      type: 'object',
      properties: {
        match_id: { type: 'string' },
        content: { type: 'string' },
      },
      required: ['match_id', 'content'],
    },
  },
  {
    name: 'social_get_messages',
    description: 'Get chat history with a matched user.',
    inputSchema: {
      type: 'object',
      properties: {
        match_id: { type: 'string' },
      },
      required: ['match_id'],
    },
  },
  {
    name: 'social_get_notifications',
    description: 'Check for new notifications.',
    inputSchema: { type: 'object', properties: {} },
  },
];

// API call helper
async function apiCall(endpoint: string, session: Session, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (session.apiKey) {
    headers['x-mcp-api-key'] = session.apiKey;
  }

  const response = await fetch(`${API_URL}/${endpoint}`, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `API error: ${response.status}`);
  }

  return data;
}

// Send SSE event to client
function sendSSE(session: Session, event: string, data: unknown) {
  if (session.sseResponse && !session.sseResponse.writableEnded) {
    session.sseResponse.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }
}

// Setup realtime subscriptions for a session
function setupRealtimeSubscriptions(sessionId: string, session: Session) {
  if (!session.profileId) return;

  // Clean up existing
  if (session.notificationsChannel) {
    supabase.removeChannel(session.notificationsChannel);
  }
  if (session.messagesChannel) {
    supabase.removeChannel(session.messagesChannel);
  }

  console.log(`[Realtime] Setting up for profile: ${session.profileId}`);

  // Subscribe to notifications
  session.notificationsChannel = supabase
    .channel(`notifications:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `profile_id=eq.${session.profileId}`,
      },
      (payload) => {
        console.log(`[Realtime] New notification for ${session.profileId}`);
        const notification = payload.new as {
          notification_type: string;
          payload: Record<string, unknown>;
        };

        // Send as MCP notification via SSE
        sendSSE(session, 'message', {
          jsonrpc: '2.0',
          method: 'notifications/message',
          params: {
            level: 'info',
            logger: 'social-mcp',
            data: {
              type: notification.notification_type,
              payload: notification.payload,
            },
          },
        });
      }
    )
    .subscribe();

  // Subscribe to messages
  session.messagesChannel = supabase
    .channel(`messages:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        const message = payload.new as {
          match_id: string;
          sender_profile_id: string;
          content: string;
        };

        if (message.sender_profile_id !== session.profileId) {
          console.log(`[Realtime] New message for ${session.profileId}`);
          sendSSE(session, 'message', {
            jsonrpc: '2.0',
            method: 'notifications/message',
            params: {
              level: 'info',
              logger: 'social-mcp',
              data: {
                type: 'new_message',
                match_id: message.match_id,
                preview: message.content.substring(0, 100),
              },
            },
          });
        }
      }
    )
    .subscribe();
}

// Handle tool calls
async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
  sessionId: string,
  session: Session
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  switch (name) {
    case 'social_register': {
      const mcpClientId = `mcp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const result = await apiCall('mcp-register', session, {
        method: 'POST',
        body: JSON.stringify({
          mcp_client_id: mcpClientId,
          display_name: args.display_name,
          bio: args.bio,
          location: args.location,
        }),
      });

      session.apiKey = result.api_key;
      session.profileId = result.profile_id;
      setupRealtimeSubscriptions(sessionId, session);

      return {
        content: [{
          type: 'text',
          text: `✅ Profile registered!\n\nProfile ID: ${result.profile_id}\n🔔 Real-time notifications are now active!\n\nUse social_set_intent to set what you're looking for.`,
        }],
      };
    }

    case 'social_login': {
      // Query profile directly
      let profile = null;
      if (args.profile_id) {
        const { data } = await supabase
          .from('profiles')
          .select('id, display_name')
          .eq('id', args.profile_id)
          .single();
        profile = data;
      } else if (args.display_name) {
        const { data } = await supabase
          .from('profiles')
          .select('id, display_name')
          .ilike('display_name', args.display_name as string)
          .order('created_at', { ascending: false })
          .limit(1);
        profile = data?.[0];
      }

      if (!profile) {
        return {
          content: [{ type: 'text', text: '❌ Profile not found. Use social_register to create one.' }],
          isError: true,
        };
      }

      // Get API key for this profile
      const { data: keyData } = await supabase
        .from('mcp_api_keys')
        .select('key_hash')
        .eq('profile_id', profile.id)
        .eq('is_active', true)
        .limit(1);

      session.profileId = profile.id;
      // Note: We can't retrieve the actual key from hash, but we can use session-based auth
      setupRealtimeSubscriptions(sessionId, session);

      return {
        content: [{
          type: 'text',
          text: `✅ Logged in as ${profile.display_name}!\n🔔 Real-time notifications active.`,
        }],
      };
    }

    case 'social_set_intent': {
      if (!session.profileId) {
        return { content: [{ type: 'text', text: '❌ Please register or login first.' }], isError: true };
      }

      const result = await apiCall('mcp-intent', session, {
        method: 'POST',
        body: JSON.stringify({
          category: args.category,
          description: args.description,
        }),
      });

      return {
        content: [{ type: 'text', text: `✅ Intent created!\n\n${result.message}` }],
      };
    }

    case 'social_get_matches': {
      if (!session.profileId) {
        return { content: [{ type: 'text', text: '❌ Please register or login first.' }], isError: true };
      }

      const result = await apiCall('mcp-match', session, { method: 'GET' });

      if (!result.matches?.length) {
        return { content: [{ type: 'text', text: 'No matches yet.' }] };
      }

      const list = result.matches.map((m: any) => {
        const score = Math.round(m.match_score * 100);
        const status = m.status === 'accepted' ? '🟢' : m.requires_my_action ? '🟡' : '⏳';
        return `• **${m.other_profile.display_name}** (${score}%) - ${status} ${m.status}\n  ID: ${m.id}`;
      }).join('\n\n');

      return { content: [{ type: 'text', text: `🤝 Matches:\n\n${list}` }] };
    }

    case 'social_respond_match': {
      if (!session.profileId) {
        return { content: [{ type: 'text', text: '❌ Please register or login first.' }], isError: true };
      }

      const result = await apiCall('mcp-match', session, {
        method: 'POST',
        body: JSON.stringify({ match_id: args.match_id, action: args.action }),
      });

      return { content: [{ type: 'text', text: `${args.action === 'accept' ? '✅' : '❌'} ${result.message}` }] };
    }

    case 'social_send_message': {
      if (!session.profileId) {
        return { content: [{ type: 'text', text: '❌ Please register or login first.' }], isError: true };
      }

      await apiCall(`mcp-chat?match_id=${args.match_id}`, session, {
        method: 'POST',
        body: JSON.stringify({ content: args.content }),
      });

      return { content: [{ type: 'text', text: '✉️ Message sent!' }] };
    }

    case 'social_get_messages': {
      if (!session.profileId) {
        return { content: [{ type: 'text', text: '❌ Please register or login first.' }], isError: true };
      }

      const result = await apiCall(`mcp-chat?match_id=${args.match_id}`, session, { method: 'GET' });

      if (!result.messages?.length) {
        return { content: [{ type: 'text', text: 'No messages yet.' }] };
      }

      const list = result.messages.map((m: any) => 
        `**${m.is_mine ? 'You' : m.sender_name}**: ${m.content}`
      ).join('\n');

      return { content: [{ type: 'text', text: `💬 Chat:\n\n${list}` }] };
    }

    case 'social_get_notifications': {
      if (!session.profileId) {
        return { content: [{ type: 'text', text: '❌ Please register or login first.' }], isError: true };
      }

      const result = await apiCall('mcp-notifications', session, { method: 'GET' });

      if (!result.notifications?.length) {
        return { content: [{ type: 'text', text: '📭 No new notifications.' }] };
      }

      const list = result.notifications.map((n: any) => {
        const icon = n.type === 'new_match' ? '🎉' : n.type === 'new_message' ? '💬' : '📢';
        return `${icon} ${n.type}`;
      }).join('\n');

      return { content: [{ type: 'text', text: `🔔 Notifications:\n\n${list}` }] };
    }

    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }
}

// Process JSON-RPC request
async function processJsonRpc(message: any, sessionId: string, session: Session): Promise<any> {
  const { jsonrpc, id, method, params } = message;

  if (jsonrpc !== '2.0') {
    return { jsonrpc: '2.0', id, error: { code: -32600, message: 'Invalid Request' } };
  }

  try {
    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {}, logging: {} },
            serverInfo: { name: 'social-mcp', version: '1.0.0' },
          },
        };

      case 'initialized':
        return { jsonrpc: '2.0', id, result: {} };

      case 'tools/list':
        return { jsonrpc: '2.0', id, result: { tools: TOOLS } };

      case 'tools/call': {
        const { name, arguments: args } = params || {};
        const result = await handleToolCall(name, args || {}, sessionId, session);
        return { jsonrpc: '2.0', id, result };
      }

      case 'resources/list':
        return { jsonrpc: '2.0', id, result: { resources: [] } };

      case 'prompts/list':
        return { jsonrpc: '2.0', id, result: { prompts: [] } };

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

// HTTP Server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type, mcp-session-id, accept, cache-control');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', sessions: sessions.size }));
    return;
  }

  // MCP endpoint
  if (url.pathname === '/mcp') {
    const incomingSessionId = req.headers['mcp-session-id'] as string;
    const sessionId = incomingSessionId || crypto.randomUUID();

    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        profileId: null,
        apiKey: null,
        sseResponse: null,
        notificationsChannel: null,
        messagesChannel: null,
      });
    }

    const session = sessions.get(sessionId)!;
    res.setHeader('Mcp-Session-Id', sessionId);

    // GET: SSE stream for push notifications
    if (req.method === 'GET') {
      console.log(`[SSE] New connection for session: ${sessionId}`);

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      // Store SSE response for push notifications
      session.sseResponse = res;

      // Send endpoint event (required by MCP spec)
      const endpointUrl = `http://${req.headers.host}/mcp`;
      res.write(`event: endpoint\ndata: ${endpointUrl}\n\n`);

      // Keep-alive ping every 30 seconds
      const keepAlive = setInterval(() => {
        if (!res.writableEnded) {
          res.write(': keepalive\n\n');
        }
      }, 30000);

      // Clean up on disconnect
      req.on('close', () => {
        console.log(`[SSE] Connection closed for session: ${sessionId}`);
        clearInterval(keepAlive);
        session.sseResponse = null;
        
        // Clean up realtime subscriptions
        if (session.notificationsChannel) {
          supabase.removeChannel(session.notificationsChannel);
        }
        if (session.messagesChannel) {
          supabase.removeChannel(session.messagesChannel);
        }
        
        // Remove session after 5 minutes of inactivity
        setTimeout(() => {
          if (!session.sseResponse) {
            sessions.delete(sessionId);
          }
        }, 5 * 60 * 1000);
      });

      return;
    }

    // POST: JSON-RPC handler
    if (req.method === 'POST') {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
      }

      try {
        const message = JSON.parse(body);
        console.log(`[RPC] ${message.method} for session: ${sessionId}`);

        const response = await processJsonRpc(message, sessionId, session);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (error) {
        console.error('Parse error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: 'Parse error' },
        }));
      }
      return;
    }

    // DELETE: Session termination
    if (req.method === 'DELETE') {
      sessions.delete(sessionId);
      res.writeHead(204);
      res.end();
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`🚀 Social MCP HTTP Server running on port ${PORT}`);
  console.log(`📡 MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`🔔 Real-time push notifications enabled via Supabase Realtime`);
});
