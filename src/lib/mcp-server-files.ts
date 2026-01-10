// MCP Server file contents for client-side zip generation
export const MCP_SERVER_FILES = {
  'mcp-server/package.json': `{
  "name": "social-mcp-server",
  "version": "1.0.0",
  "description": "Social MCP - The first social network of the AI era",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "start:http": "node dist/http-server.js",
    "dev": "tsx watch src/index.ts",
    "dev:http": "tsx watch src/http-server.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@supabase/supabase-js": "^2.49.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.0"
  },
  "keywords": ["mcp", "social", "ai", "networking"],
  "author": "",
  "license": "MIT"
}`,

  'mcp-server/tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`,

  'mcp-server/Dockerfile': `# Dockerfile for Social MCP HTTP Server
# Deploy to Railway, Fly.io, Render, or any container host

FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built files
COPY dist/ ./dist/

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Run HTTP server
CMD ["node", "dist/http-server.js"]`,

  'mcp-server/fly.toml': `# Fly.io configuration for Social MCP Server
# Deploy with: fly launch && fly deploy

app = "social-mcp-server"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "3000"
  SOCIAL_MCP_API_URL = "https://cwaozizmiipxstlwmepk.supabase.co/functions/v1"
  SUPABASE_URL = "https://cwaozizmiipxstlwmepk.supabase.co"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[services]]
  protocol = "tcp"
  internal_port = 3000

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [services.concurrency]
    type = "connections"
    hard_limit = 1000
    soft_limit = 500

  [[services.http_checks]]
    interval = 10000
    grace_period = "5s"
    method = "get"
    path = "/health"
    protocol = "http"
    timeout = 2000`,

  'mcp-server/DEPLOY.md': `# Social MCP Server - Deployable HTTP Server

A hosted MCP server with **real-time push notifications** via Supabase Realtime.

## Deploy Options

### Option 1: Railway (Recommended)

\`\`\`bash
cd mcp-server
npm install && npm run build

# Push to GitHub, then:
# 1. Go to railway.app
# 2. New Project → Deploy from GitHub
# 3. Select your repo, set root directory to "mcp-server"
# 4. Add environment variables (see below)
# 5. Deploy!
\`\`\`

### Option 2: Fly.io

\`\`\`bash
cd mcp-server
npm install && npm run build

# Install flyctl if needed: curl -L https://fly.io/install.sh | sh
fly launch
fly deploy
\`\`\`

### Option 3: Render

1. Create a new Web Service on render.com
2. Connect your GitHub repo
3. Set build command: \`npm install && npm run build\`
4. Set start command: \`npm run start:http\`
5. Add environment variables

### Option 4: Docker (Self-hosted)

\`\`\`bash
cd mcp-server
npm install && npm run build
docker build -t social-mcp-server .
docker run -p 3000:3000 social-mcp-server
\`\`\`

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| \`PORT\` | No | \`3000\` | HTTP server port |
| \`SOCIAL_MCP_API_URL\` | No | (embedded) | Backend API URL |
| \`SUPABASE_URL\` | No | (embedded) | Supabase project URL |
| \`SUPABASE_ANON_KEY\` | No | (embedded) | Supabase anon key |

## Claude Desktop Configuration

Once deployed, configure Claude Desktop:

\`\`\`json
{
  "mcpServers": {
    "social-mcp": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://your-deployed-server.fly.dev/mcp"
      ]
    }
  }
}
\`\`\`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | \`/mcp\` | SSE stream for push notifications |
| POST | \`/mcp\` | JSON-RPC handler for MCP commands |
| DELETE | \`/mcp\` | Terminate session |
| GET | \`/health\` | Health check |`,

  'mcp-server/README.md': `# Social MCP Server

The first social network of the AI era. Connect humans through their AI assistants.

## Quick Start

\`\`\`bash
cd mcp-server
npm install
npm run build
npm run start:http
\`\`\`

## Features

- **Real-time Push Notifications** via Supabase Realtime
- **SSE Streaming** for persistent connections
- **Full MCP Protocol** support

## Available Tools

| Tool | Description |
|------|-------------|
| \`social_register\` | Register a new profile |
| \`social_login\` | Log into existing profile |
| \`social_set_intent\` | Set connection preferences |
| \`social_get_matches\` | View current matches |
| \`social_respond_match\` | Accept/reject matches |
| \`social_send_message\` | Send messages |
| \`social_get_messages\` | View chat history |
| \`social_get_notifications\` | Check notifications |

## Deployment

See [DEPLOY.md](./DEPLOY.md) for deployment instructions.`,

  'mcp-server/src/http-server.ts': `#!/usr/bin/env node
/**
 * Social MCP HTTP Server with SSE Push Notifications
 * 
 * Deploy this to Railway, Fly.io, Render, or any Node.js host.
 * Provides real-time push via Server-Sent Events using Supabase Realtime.
 */

import http from 'http';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const PORT = parseInt(process.env.PORT || '3000');
const API_URL = process.env.SOCIAL_MCP_API_URL || 'https://cwaozizmiipxstlwmepk.supabase.co/functions/v1';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cwaozizmiipxstlwmepk.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3YW96aXptaWlweHN0bHdtZXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NjY0MjMsImV4cCI6MjA4MzU0MjQyM30.QArs0EZmysGrPTrpMUSsUizkDav9uHZgCqOYF1Dva9w';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface Session {
  profileId: string | null;
  apiKey: string | null;
  sseResponse: http.ServerResponse | null;
  notificationsChannel: RealtimeChannel | null;
  messagesChannel: RealtimeChannel | null;
}

const sessions = new Map<string, Session>();

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
  {
    name: 'social_find_matches',
    description: 'Manually trigger the matching algorithm to find new matches for your intents.',
    inputSchema: { type: 'object', properties: {} },
  },
];

async function apiCall(endpoint: string, session: Session, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (session.apiKey) {
    headers['x-mcp-api-key'] = session.apiKey;
  }

  const response = await fetch(\`\${API_URL}/\${endpoint}\`, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || \`API error: \${response.status}\`);
  }

  return data;
}

function sendSSE(session: Session, event: string, data: unknown) {
  if (session.sseResponse && !session.sseResponse.writableEnded) {
    session.sseResponse.write(\`event: \${event}\\ndata: \${JSON.stringify(data)}\\n\\n\`);
  }
}

function setupRealtimeSubscriptions(sessionId: string, session: Session) {
  if (!session.profileId) return;

  if (session.notificationsChannel) {
    supabase.removeChannel(session.notificationsChannel);
  }
  if (session.messagesChannel) {
    supabase.removeChannel(session.messagesChannel);
  }

  console.log(\`[Realtime] Setting up for profile: \${session.profileId}\`);

  session.notificationsChannel = supabase
    .channel(\`notifications:\${sessionId}\`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: \`profile_id=eq.\${session.profileId}\`,
      },
      (payload) => {
        console.log(\`[Realtime] New notification for \${session.profileId}\`);
        const notification = payload.new as {
          notification_type: string;
          payload: Record<string, unknown>;
        };

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

  session.messagesChannel = supabase
    .channel(\`messages:\${sessionId}\`)
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
          console.log(\`[Realtime] New message for \${session.profileId}\`);
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

async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
  sessionId: string,
  session: Session
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  switch (name) {
    case 'social_register': {
      const mcpClientId = \`mcp_\${Date.now()}_\${Math.random().toString(36).substring(7)}\`;
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
      
      // Save session to database for persistence across requests
      await supabase.from('mcp_sessions').upsert({
        session_id: sessionId,
        profile_id: result.profile_id,
        last_used_at: new Date().toISOString(),
      }, { onConflict: 'session_id' });
      console.log(\`[Session] Saved session \${sessionId} to database for profile \${result.profile_id}\`);
      
      setupRealtimeSubscriptions(sessionId, session);

      return {
        content: [{
          type: 'text',
          text: \`✅ Profile registered!\\n\\nProfile ID: \${result.profile_id}\\n🔔 Real-time notifications are now active!\\n\\nUse social_set_intent to set what you're looking for.\`,
        }],
      };
    }

    case 'social_login': {
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

      // Generate a new API key for this session
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      const apiKey = 'smcp_' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Hash and store it
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(apiKey));
      const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      await supabase.from('mcp_api_keys').insert({
        profile_id: profile.id,
        key_hash: keyHash,
        name: \`MCP Login - \${new Date().toISOString()}\`,
        scopes: ['read', 'write'],
        is_active: true,
      });

      session.apiKey = apiKey;
      session.profileId = profile.id;
      
      // Save session to database for persistence across requests
      await supabase.from('mcp_sessions').upsert({
        session_id: sessionId,
        profile_id: profile.id,
        last_used_at: new Date().toISOString(),
      }, { onConflict: 'session_id' });
      console.log(\`[Session] Saved session \${sessionId} to database for profile \${profile.id}\`);
      
      setupRealtimeSubscriptions(sessionId, session);

      return {
        content: [{
          type: 'text',
          text: \`✅ Logged in as \${profile.display_name}!\\n🔔 Real-time notifications active.\`,
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
        content: [{ type: 'text', text: \`✅ Intent created!\\n\\n\${result.message}\` }],
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
        return \`• **\${m.other_profile.display_name}** (\${score}%) - \${status} \${m.status}\\n  ID: \${m.id}\`;
      }).join('\\n\\n');

      return { content: [{ type: 'text', text: \`🤝 Matches:\\n\\n\${list}\` }] };
    }

    case 'social_respond_match': {
      if (!session.profileId) {
        return { content: [{ type: 'text', text: '❌ Please register or login first.' }], isError: true };
      }

      const result = await apiCall('mcp-match', session, {
        method: 'POST',
        body: JSON.stringify({ match_id: args.match_id, action: args.action }),
      });

      return { content: [{ type: 'text', text: \`\${args.action === 'accept' ? '✅' : '❌'} \${result.message}\` }] };
    }

    case 'social_send_message': {
      if (!session.profileId) {
        return { content: [{ type: 'text', text: '❌ Please register or login first.' }], isError: true };
      }

      await apiCall(\`mcp-chat?match_id=\${args.match_id}\`, session, {
        method: 'POST',
        body: JSON.stringify({ content: args.content }),
      });

      return { content: [{ type: 'text', text: '✉️ Message sent!' }] };
    }

    case 'social_get_messages': {
      if (!session.profileId) {
        return { content: [{ type: 'text', text: '❌ Please register or login first.' }], isError: true };
      }

      const result = await apiCall(\`mcp-chat?match_id=\${args.match_id}\`, session, { method: 'GET' });

      if (!result.messages?.length) {
        return { content: [{ type: 'text', text: 'No messages yet.' }] };
      }

      const list = result.messages.map((m: any) => 
        \`**\${m.is_mine ? 'You' : m.sender_name}**: \${m.content}\`
      ).join('\\n');

      return { content: [{ type: 'text', text: \`💬 Chat:\\n\\n\${list}\` }] };
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
        return \`\${icon} \${n.type}\`;
      }).join('\\n');

      return { content: [{ type: 'text', text: \`🔔 Notifications:\\n\\n\${list}\` }] };
    }

    case 'social_get_intents': {
      if (!session.profileId) {
        return { content: [{ type: 'text', text: '❌ Please register or login first.' }], isError: true };
      }

      // Query intents directly from database
      const { data: intents, error } = await supabase
        .from('intents')
        .select('*')
        .eq('profile_id', session.profileId)
        .eq('is_active', true);

      if (error) throw error;

      if (!intents?.length) {
        return { content: [{ type: 'text', text: 'No active intents. Use social_set_intent to set what you\\'re looking for.' }] };
      }

      const list = intents.map((i: any) => \`• **\${i.category}**: \${i.description}\`).join('\\n');
      return { content: [{ type: 'text', text: \`📋 Your intents:\\n\\n\${list}\` }] };
    }

    case 'social_find_matches': {
      if (!session.profileId) {
        return { content: [{ type: 'text', text: '❌ Please register or login first.' }], isError: true };
      }

      try {
        const result = await apiCall('mcp-find-matches', session, { method: 'POST' });
        return {
          content: [{
            type: 'text',
            text: \`🔍 Matching complete!\\n\\nNew matches found: \${result.matches_created || 0}\\n\\nUse social_get_matches to see your matches.\`,
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: \`🔍 Matching attempted.\\n\\nCheck social_get_matches to see your current matches.\`,
          }],
        };
      }
    }

    default:
      return { content: [{ type: 'text', text: \`Unknown tool: \${name}\` }], isError: true };
  }
}

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
        return { jsonrpc: '2.0', id, error: { code: -32601, message: \`Method not found: \${method}\` } };
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

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', \`http://\${req.headers.host}\`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type, mcp-session-id, accept, cache-control');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', sessions: sessions.size }));
    return;
  }

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
    
    // Restore session from database if profileId is null but we have a session ID
    if (!session.profileId && incomingSessionId) {
      const { data: dbSession } = await supabase
        .from('mcp_sessions')
        .select('profile_id')
        .eq('session_id', incomingSessionId)
        .single();
      
      if (dbSession?.profile_id) {
        session.profileId = dbSession.profile_id;
        console.log(\`[Session] Restored profile \${session.profileId} from database for session \${sessionId}\`);
        
        // Update last_used_at
        await supabase
          .from('mcp_sessions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('session_id', incomingSessionId);
          
        // Setup realtime subscriptions for restored session
        setupRealtimeSubscriptions(sessionId, session);
      }
    }
    
    res.setHeader('Mcp-Session-Id', sessionId);

    if (req.method === 'GET') {
      console.log(\`[SSE] New connection for session: \${sessionId}\`);

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      session.sseResponse = res;

      const endpointUrl = \`http://\${req.headers.host}/mcp\`;
      res.write(\`event: endpoint\\ndata: \${endpointUrl}\\n\\n\`);

      const keepAlive = setInterval(() => {
        if (!res.writableEnded) {
          res.write(': keepalive\\n\\n');
        }
      }, 30000);

      req.on('close', () => {
        console.log(\`[SSE] Connection closed for session: \${sessionId}\`);
        clearInterval(keepAlive);
        session.sseResponse = null;
        
        if (session.notificationsChannel) {
          supabase.removeChannel(session.notificationsChannel);
        }
        if (session.messagesChannel) {
          supabase.removeChannel(session.messagesChannel);
        }
        
        setTimeout(() => {
          if (!session.sseResponse) {
            sessions.delete(sessionId);
          }
        }, 5 * 60 * 1000);
      });

      return;
    }

    if (req.method === 'POST') {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
      }

      try {
        const message = JSON.parse(body);
        console.log(\`[RPC] \${message.method} for session: \${sessionId}\`);

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
  console.log(\`🚀 Social MCP HTTP Server running on port \${PORT}\`);
  console.log(\`📡 MCP endpoint: http://localhost:\${PORT}/mcp\`);
  console.log(\`🔔 Real-time push notifications enabled via Supabase Realtime\`);
});`,

  'mcp-server/src/index.ts': `#!/usr/bin/env node
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

let apiKey: string | null = null;
let profileId: string | null = null;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let notificationsChannel: RealtimeChannel | null = null;
let messagesChannel: RealtimeChannel | null = null;

const pendingNotifications: Array<{
  type: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}> = [];

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (apiKey) {
    headers['x-mcp-api-key'] = apiKey;
  }

  const response = await fetch(\`\${API_URL}/\${endpoint}\`, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || \`API error: \${response.status}\`);
  }

  return data;
}

function setupRealtimeSubscriptions(currentProfileId: string) {
  if (notificationsChannel) {
    supabase.removeChannel(notificationsChannel);
  }
  if (messagesChannel) {
    supabase.removeChannel(messagesChannel);
  }

  console.error(\`[Realtime] Setting up subscriptions for profile: \${currentProfileId}\`);

  notificationsChannel = supabase
    .channel(\`notifications:\${currentProfileId}\`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: \`profile_id=eq.\${currentProfileId}\`,
      },
      (payload) => {
        console.error(\`[Realtime] New notification: \${JSON.stringify(payload.new)}\`);
        const notification = payload.new as {
          notification_type: string;
          payload: Record<string, unknown>;
        };
        
        pendingNotifications.push({
          type: notification.notification_type,
          payload: notification.payload,
          timestamp: new Date(),
        });

        const icon = notification.notification_type === 'new_match' ? '🎉' :
                    notification.notification_type === 'match_accepted' ? '🤝' :
                    notification.notification_type === 'new_message' ? '💬' : '📢';
        console.error(\`[NOTIFICATION] \${icon} \${notification.notification_type}: \${JSON.stringify(notification.payload)}\`);
      }
    )
    .subscribe((status) => {
      console.error(\`[Realtime] Notifications channel status: \${status}\`);
    });

  messagesChannel = supabase
    .channel(\`messages:\${currentProfileId}\`)
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
        
        if (message.sender_profile_id !== currentProfileId) {
          console.error(\`[Realtime] New message in match \${message.match_id}\`);
          
          pendingNotifications.push({
            type: 'new_message',
            payload: {
              match_id: message.match_id,
              preview: message.content.substring(0, 100),
            },
            timestamp: new Date(),
          });

          console.error(\`[NOTIFICATION] 💬 New message: "\${message.content.substring(0, 50)}..."\`);
        }
      }
    )
    .subscribe((status) => {
      console.error(\`[Realtime] Messages channel status: \${status}\`);
    });
}

const server = new Server(
  { name: 'social-mcp', version: '1.0.0' },
  { capabilities: { tools: {}, resources: { subscribe: true } } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'social_register',
      description: 'Register or update your Social MCP profile.',
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
          display_name: { type: 'string', description: 'Your display name' },
          profile_id: { type: 'string', description: 'Your profile ID' },
        },
      },
    },
    {
      name: 'social_set_intent',
      description: 'Set what kind of connections you are looking for.',
      inputSchema: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: ['professional', 'romance', 'friendship', 'expertise', 'sports', 'learning', 'other'] },
          description: { type: 'string', description: 'What you are looking for' },
        },
        required: ['category', 'description'],
      },
    },
    {
      name: 'social_get_matches',
      description: 'Get your current matches.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'social_respond_match',
      description: 'Accept or reject a match.',
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
        properties: { match_id: { type: 'string' } },
        required: ['match_id'],
      },
    },
    {
      name: 'social_get_notifications',
      description: 'Get new notifications.',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'social_register': {
        const mcpClientId = \`mcp_\${Date.now()}_\${Math.random().toString(36).substring(7)}\`;
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
        if (profileId) setupRealtimeSubscriptions(profileId);

        return {
          content: [{
            type: 'text',
            text: \`✅ Profile registered!\\n\\nProfile ID: \${profileId}\\n🔔 Realtime notifications active.\\n\\nUse social_set_intent to set what you're looking for.\`,
          }],
        };
      }

      case 'social_login': {
        let profile = null;
        if (args?.profile_id) {
          const { data } = await supabase.from('profiles').select('id, display_name').eq('id', args.profile_id).single();
          profile = data;
        } else if (args?.display_name) {
          const { data } = await supabase.from('profiles').select('id, display_name').ilike('display_name', args.display_name as string).limit(1);
          profile = data?.[0];
        }

        if (!profile) {
          return { content: [{ type: 'text', text: '❌ Profile not found.' }], isError: true };
        }

        profileId = profile.id;
        if (profileId) setupRealtimeSubscriptions(profileId);

        return { content: [{ type: 'text', text: \`✅ Logged in as \${profile.display_name}!\\n🔔 Realtime notifications active.\` }] };
      }

      case 'social_set_intent': {
        if (!profileId) return { content: [{ type: 'text', text: '❌ Please register first.' }], isError: true };
        const result = await apiCall('mcp-intent', { method: 'POST', body: JSON.stringify({ category: args?.category, description: args?.description }) });
        return { content: [{ type: 'text', text: \`✅ Intent created!\\n\\n\${result.message}\` }] };
      }

      case 'social_get_matches': {
        if (!profileId) return { content: [{ type: 'text', text: '❌ Please register first.' }], isError: true };
        const result = await apiCall('mcp-match', { method: 'GET' });
        if (!result.matches?.length) return { content: [{ type: 'text', text: 'No matches yet.' }] };
        const list = result.matches.map((m: any) => \`• \${m.other_profile.display_name} (\${Math.round(m.match_score * 100)}%) - \${m.status}\\n  ID: \${m.id}\`).join('\\n\\n');
        return { content: [{ type: 'text', text: \`🤝 Matches:\\n\\n\${list}\` }] };
      }

      case 'social_respond_match': {
        if (!profileId) return { content: [{ type: 'text', text: '❌ Please register first.' }], isError: true };
        const result = await apiCall('mcp-match', { method: 'POST', body: JSON.stringify({ match_id: args?.match_id, action: args?.action }) });
        return { content: [{ type: 'text', text: \`\${args?.action === 'accept' ? '✅' : '❌'} \${result.message}\` }] };
      }

      case 'social_send_message': {
        if (!profileId) return { content: [{ type: 'text', text: '❌ Please register first.' }], isError: true };
        await apiCall(\`mcp-chat?match_id=\${args?.match_id}\`, { method: 'POST', body: JSON.stringify({ content: args?.content }) });
        return { content: [{ type: 'text', text: '✉️ Message sent!' }] };
      }

      case 'social_get_messages': {
        if (!profileId) return { content: [{ type: 'text', text: '❌ Please register first.' }], isError: true };
        const result = await apiCall(\`mcp-chat?match_id=\${args?.match_id}\`, { method: 'GET' });
        if (!result.messages?.length) return { content: [{ type: 'text', text: 'No messages yet.' }] };
        const list = result.messages.map((m: any) => \`**\${m.is_mine ? 'You' : m.sender_name}**: \${m.content}\`).join('\\n');
        return { content: [{ type: 'text', text: \`💬 Chat:\\n\\n\${list}\` }] };
      }

      case 'social_get_notifications': {
        if (!profileId) return { content: [{ type: 'text', text: '❌ Please register first.' }], isError: true };
        const realtimeNotifs = [...pendingNotifications];
        pendingNotifications.length = 0;
        const result = await apiCall('mcp-notifications', { method: 'GET' });
        const all = [...realtimeNotifs.map(n => ({ type: n.type, source: 'realtime' })), ...(result.notifications || []).map((n: any) => ({ type: n.type, source: 'api' }))];
        if (!all.length) return { content: [{ type: 'text', text: '📭 No new notifications.' }] };
        const list = all.map(n => \`\${n.type === 'new_match' ? '🎉' : n.type === 'new_message' ? '💬' : '📢'} \${n.type}\`).join('\\n');
        return { content: [{ type: 'text', text: \`🔔 Notifications:\\n\\n\${list}\` }] };
      }

      default:
        return { content: [{ type: 'text', text: \`Unknown tool: \${name}\` }], isError: true };
    }
  } catch (error) {
    return { content: [{ type: 'text', text: \`Error: \${error instanceof Error ? error.message : 'Unknown'}\` }], isError: true };
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    { uri: 'social://notifications', name: 'Notifications', mimeType: 'application/json' },
    { uri: 'social://matches', name: 'Matches', mimeType: 'application/json' },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  if (!profileId) {
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ error: 'Not registered' }) }] };
  }
  try {
    if (uri === 'social://notifications') {
      const result = await apiCall('mcp-notifications', { method: 'GET' });
      return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ pending: pendingNotifications, api: result.notifications || [] }) }] };
    }
    if (uri === 'social://matches') {
      const result = await apiCall('mcp-match', { method: 'GET' });
      return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(result) }] };
    }
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ error: 'Unknown resource' }) }] };
  } catch (error) {
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown' }) }] };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Social MCP Server running with realtime support');
}

main().catch(console.error);`,
};