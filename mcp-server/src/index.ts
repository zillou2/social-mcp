#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const API_URL = process.env.SOCIAL_MCP_API_URL || 'https://cwaozizmiipxstlwmepk.supabase.co/functions/v1';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cwaozizmiipxstlwmepk.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3YW96aXptaWlweHN0bHdtZXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjY0MjMsImV4cCI6MjA4MzU0MjQyM30.QArs0EZmysGrPTrpMUSsUizkDav9uHZgCqOYF1Dva9w';

// Store credentials
let apiKey: string | null = null;
let profileId: string | null = null;

// Supabase client for realtime
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Realtime channels
let notificationsChannel: RealtimeChannel | null = null;
let messagesChannel: RealtimeChannel | null = null;

// Pending notifications queue (for resource reads)
const pendingNotifications: Array<{
  type: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}> = [];

// Helper to make API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (apiKey) {
    headers['x-mcp-api-key'] = apiKey;
  }

  const response = await fetch(`${API_URL}/${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `API error: ${response.status}`);
  }

  return data;
}

// Setup realtime subscriptions
function setupRealtimeSubscriptions(currentProfileId: string) {
  // Clean up existing subscriptions
  if (notificationsChannel) {
    supabase.removeChannel(notificationsChannel);
  }
  if (messagesChannel) {
    supabase.removeChannel(messagesChannel);
  }

  console.error(`[Realtime] Setting up subscriptions for profile: ${currentProfileId}`);

  // Subscribe to notifications for this profile
  notificationsChannel = supabase
    .channel(`notifications:${currentProfileId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `profile_id=eq.${currentProfileId}`,
      },
      (payload) => {
        console.error(`[Realtime] New notification: ${JSON.stringify(payload.new)}`);
        const notification = payload.new as {
          notification_type: string;
          payload: Record<string, unknown>;
        };
        
        pendingNotifications.push({
          type: notification.notification_type,
          payload: notification.payload,
          timestamp: new Date(),
        });

        // Log to stderr so Claude can see it in logs
        const icon = notification.notification_type === 'new_match' ? '🎉' :
                    notification.notification_type === 'match_accepted' ? '🤝' :
                    notification.notification_type === 'new_message' ? '💬' : '📢';
        console.error(`[NOTIFICATION] ${icon} ${notification.notification_type}: ${JSON.stringify(notification.payload)}`);
      }
    )
    .subscribe((status) => {
      console.error(`[Realtime] Notifications channel status: ${status}`);
    });

  // Subscribe to messages where this profile is part of an accepted match
  // We'll subscribe to all messages and filter in the handler
  messagesChannel = supabase
    .channel(`messages:${currentProfileId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      async (payload) => {
        const message = payload.new as {
          match_id: string;
          sender_profile_id: string;
          content: string;
        };
        
        // Only notify if we're not the sender
        if (message.sender_profile_id !== currentProfileId) {
          console.error(`[Realtime] New message in match ${message.match_id}`);
          
          pendingNotifications.push({
            type: 'new_message',
            payload: {
              match_id: message.match_id,
              preview: message.content.substring(0, 100),
            },
            timestamp: new Date(),
          });

          console.error(`[NOTIFICATION] 💬 New message: "${message.content.substring(0, 50)}..."`);
        }
      }
    )
    .subscribe((status) => {
      console.error(`[Realtime] Messages channel status: ${status}`);
    });
}

// Create server
const server = new Server(
  {
    name: 'social-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {
        subscribe: true,
      },
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'social_register',
        description: 'Register or update your Social MCP profile. This is required before using other features.',
        inputSchema: {
          type: 'object',
          properties: {
            display_name: {
              type: 'string',
              description: 'Your display name visible to matches',
            },
            bio: {
              type: 'string',
              description: 'A brief bio about yourself',
            },
            location: {
              type: 'string',
              description: 'Your location (optional)',
            },
          },
          required: ['display_name', 'bio'],
        },
      },
      {
        name: 'social_login',
        description: 'Log in to your existing Social MCP profile if you have registered before.',
        inputSchema: {
          type: 'object',
          properties: {
            display_name: {
              type: 'string',
              description: 'Your display name (case-insensitive)',
            },
            profile_id: {
              type: 'string',
              description: 'Your profile ID (if you know it)',
            },
          },
        },
      },
      {
        name: 'social_set_intent',
        description: 'Set what kind of connections you are looking for (job, romance, friendship, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              enum: ['professional', 'romance', 'friendship', 'expertise', 'sports', 'learning', 'other'],
              description: 'The category of connection you seek',
            },
            description: {
              type: 'string',
              description: 'Natural language description of what you are looking for',
            },
            criteria: {
              type: 'object',
              description: 'Additional structured criteria (optional)',
            },
          },
          required: ['category', 'description'],
        },
      },
      {
        name: 'social_get_intents',
        description: 'Get your current active intents',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'social_get_matches',
        description: 'Get your current matches and pending introductions',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'social_respond_match',
        description: 'Accept or reject a match introduction',
        inputSchema: {
          type: 'object',
          properties: {
            match_id: {
              type: 'string',
              description: 'The ID of the match',
            },
            action: {
              type: 'string',
              enum: ['accept', 'reject'],
              description: 'Whether to accept or reject the match',
            },
          },
          required: ['match_id', 'action'],
        },
      },
      {
        name: 'social_send_message',
        description: 'Send a message to a matched user (only works for accepted matches)',
        inputSchema: {
          type: 'object',
          properties: {
            match_id: {
              type: 'string',
              description: 'The ID of the match',
            },
            content: {
              type: 'string',
              description: 'Your message',
            },
          },
          required: ['match_id', 'content'],
        },
      },
      {
        name: 'social_get_messages',
        description: 'Get chat history with a matched user',
        inputSchema: {
          type: 'object',
          properties: {
            match_id: {
              type: 'string',
              description: 'The ID of the match',
            },
          },
          required: ['match_id'],
        },
      },
      {
        name: 'social_get_notifications',
        description: 'Get new notifications (new matches, messages, etc.). With realtime enabled, this also returns any push notifications received.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'social_register': {
        const mcpClientId = `mcp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        const result = await apiCall('mcp-register', {
          method: 'POST',
          body: JSON.stringify({
            mcp_client_id: mcpClientId,
            display_name: args?.display_name,
            bio: args?.bio,
            location: args?.location,
          }),
        });

        apiKey = result.api_key;
        profileId = result.profile_id;

        // Setup realtime subscriptions
        setupRealtimeSubscriptions(profileId);

        return {
          content: [
            {
              type: 'text',
              text: `✅ Profile registered successfully!\n\nProfile ID: ${profileId}\n\n🔔 Realtime notifications are now active. You'll receive push notifications for new messages and matches.\n\nYou can now:\n- Set your intent with social_set_intent\n- Check for matches with social_get_matches\n- View notifications with social_get_notifications`,
            },
          ],
        };
      }

      case 'social_login': {
        // First get profile info from API
        const result = await apiCall('mcp', {
          method: 'POST',
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: {
              name: 'social_login',
              arguments: args,
            },
          }),
        });

        // Extract profile ID from response
        const responseText = result.result?.content?.[0]?.text || '';
        const profileIdMatch = responseText.match(/Profile ID: ([a-f0-9-]+)/);
        
        if (profileIdMatch) {
          profileId = profileIdMatch[1];
          
          // We need to get an API key for this profile
          // For now, we'll use session-based auth via the MCP endpoint
          setupRealtimeSubscriptions(profileId);

          return {
            content: [
              {
                type: 'text',
                text: `${responseText}\n\n🔔 Realtime notifications are now active.`,
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: responseText,
            },
          ],
          isError: responseText.includes('❌'),
        };
      }

      case 'social_set_intent': {
        if (!apiKey && !profileId) {
          return {
            content: [{ type: 'text', text: '❌ Please register or login first using social_register or social_login' }],
            isError: true,
          };
        }

        const result = await apiCall('mcp-intent', {
          method: 'POST',
          body: JSON.stringify({
            category: args?.category,
            description: args?.description,
            criteria: args?.criteria,
          }),
        });

        return {
          content: [
            {
              type: 'text',
              text: `✅ Intent created!\n\nCategory: ${args?.category}\nDescription: ${args?.description}\n\n${result.message}\n\nI'll look for matches and notify you when found.`,
            },
          ],
        };
      }

      case 'social_get_intents': {
        if (!apiKey && !profileId) {
          return {
            content: [{ type: 'text', text: '❌ Please register first using social_register' }],
            isError: true,
          };
        }

        const result = await apiCall('mcp-intent', { method: 'GET' });

        if (!result.intents?.length) {
          return {
            content: [{ type: 'text', text: 'You have no active intents. Use social_set_intent to create one.' }],
          };
        }

        const intentList = result.intents
          .map((i: { category: string; description: string; created_at: string }) => 
            `• ${i.category}: ${i.description} (created: ${new Date(i.created_at).toLocaleDateString()})`)
          .join('\n');

        return {
          content: [{ type: 'text', text: `📋 Your active intents:\n\n${intentList}` }],
        };
      }

      case 'social_get_matches': {
        if (!apiKey && !profileId) {
          return {
            content: [{ type: 'text', text: '❌ Please register first using social_register' }],
            isError: true,
          };
        }

        const result = await apiCall('mcp-match', { method: 'GET' });

        if (!result.matches?.length) {
          return {
            content: [{ type: 'text', text: 'No matches yet. Keep your intents active and check back later!' }],
          };
        }

        interface Match {
          id: string;
          match_score: number;
          status: string;
          other_profile: { display_name?: string };
          their_intent: { category?: string; description?: string };
          match_reason: string;
          requires_my_action: boolean;
        }

        const matchList = result.matches
          .map((m: Match) => {
            const score = Math.round(m.match_score * 100);
            const status = m.status === 'accepted' ? '🟢 Connected' : 
                          m.requires_my_action ? '🟡 Awaiting your response' : '⏳ Awaiting their response';
            return `• **${m.other_profile.display_name}** (${score}% match)\n  Looking for: ${m.their_intent?.category} - ${m.their_intent?.description}\n  Why: ${m.match_reason}\n  Status: ${status}\n  ID: ${m.id}`;
          })
          .join('\n\n');

        return {
          content: [{ type: 'text', text: `🤝 Your matches:\n\n${matchList}\n\nUse social_respond_match to accept/reject pending matches.` }],
        };
      }

      case 'social_respond_match': {
        if (!apiKey && !profileId) {
          return {
            content: [{ type: 'text', text: '❌ Please register first using social_register' }],
            isError: true,
          };
        }

        const result = await apiCall('mcp-match', {
          method: 'POST',
          body: JSON.stringify({
            match_id: args?.match_id,
            action: args?.action,
          }),
        });

        const emoji = args?.action === 'accept' ? '✅' : '❌';
        return {
          content: [{ type: 'text', text: `${emoji} ${result.message}` }],
        };
      }

      case 'social_send_message': {
        if (!apiKey && !profileId) {
          return {
            content: [{ type: 'text', text: '❌ Please register first using social_register' }],
            isError: true,
          };
        }

        await apiCall(`mcp-chat?match_id=${args?.match_id}`, {
          method: 'POST',
          body: JSON.stringify({
            content: args?.content,
          }),
        });

        return {
          content: [{ type: 'text', text: '✉️ Message sent!' }],
        };
      }

      case 'social_get_messages': {
        if (!apiKey && !profileId) {
          return {
            content: [{ type: 'text', text: '❌ Please register first using social_register' }],
            isError: true,
          };
        }

        const result = await apiCall(`mcp-chat?match_id=${args?.match_id}`, { method: 'GET' });

        if (!result.messages?.length) {
          return {
            content: [{ type: 'text', text: 'No messages yet. Start the conversation!' }],
          };
        }

        interface Message {
          is_mine: boolean;
          sender_name: string;
          content: string;
          created_at: string;
        }

        const messageList = result.messages
          .map((m: Message) => {
            const sender = m.is_mine ? 'You' : m.sender_name;
            return `**${sender}** (${new Date(m.created_at).toLocaleString()}):\n${m.content}`;
          })
          .join('\n\n');

        return {
          content: [{ type: 'text', text: `💬 Chat history:\n\n${messageList}` }],
        };
      }

      case 'social_get_notifications': {
        if (!apiKey && !profileId) {
          return {
            content: [{ type: 'text', text: '❌ Please register first using social_register' }],
            isError: true,
          };
        }

        // Get pending realtime notifications first
        const realtimeNotifs = [...pendingNotifications];
        pendingNotifications.length = 0; // Clear the queue

        // Also fetch from API (in case we missed any)
        const result = await apiCall('mcp-notifications', { method: 'GET' });

        const allNotifications = [
          ...realtimeNotifs.map(n => ({
            type: n.type,
            payload: n.payload,
            source: 'realtime',
          })),
          ...(result.notifications || []).map((n: { type: string; payload: Record<string, unknown> }) => ({
            type: n.type,
            payload: n.payload,
            source: 'api',
          })),
        ];

        if (!allNotifications.length) {
          return {
            content: [{ type: 'text', text: '📭 No new notifications.' }],
          };
        }

        const notifList = allNotifications
          .map((n) => {
            const icon = n.type === 'new_match' ? '🎉' :
                        n.type === 'match_accepted' ? '🤝' :
                        n.type === 'new_message' ? '💬' : '📢';
            const source = n.source === 'realtime' ? ' (realtime)' : '';
            return `${icon} ${n.type.replace(/_/g, ' ')}${source}: ${JSON.stringify(n.payload)}`;
          })
          .join('\n');

        return {
          content: [{ type: 'text', text: `🔔 Notifications:\n\n${notifList}` }],
        };
      }

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
      isError: true,
    };
  }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'social://notifications',
        name: 'Social MCP Notifications',
        description: 'Real-time notifications about matches and messages (with push support)',
        mimeType: 'application/json',
      },
      {
        uri: 'social://matches',
        name: 'Social MCP Matches',
        description: 'Your current matches and their status',
        mimeType: 'application/json',
      },
    ],
  };
});

// Read resources
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (!apiKey && !profileId) {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'Not registered. Use social_register first.' }),
        },
      ],
    };
  }

  try {
    if (uri === 'social://notifications') {
      // Include pending realtime notifications
      const realtimeNotifs = [...pendingNotifications];
      
      const result = await apiCall('mcp-notifications', { method: 'GET' });
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              realtime_pending: realtimeNotifs,
              api_notifications: result.notifications || [],
            }),
          },
        ],
      };
    }

    if (uri === 'social://matches') {
      const result = await apiCall('mcp-match', { method: 'GET' });
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(result),
          },
        ],
      };
    }

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'Unknown resource' }),
        },
      ],
    };
  } catch (error) {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
        },
      ],
    };
  }
});

// Main function
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Social MCP Server running with realtime support');
  console.error('Waiting for registration to activate realtime subscriptions...');
}

main().catch(console.error);
