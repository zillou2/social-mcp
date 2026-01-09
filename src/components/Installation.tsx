import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download, Copy, Check, Terminal, Settings, MessageSquare, Loader2 } from 'lucide-react';
import { useState } from 'react';
import JSZip from 'jszip';

const API_URL = 'https://cwaozizmiipxstlwmepk.supabase.co/functions/v1';

const configExample = `{
  "mcpServers": {
    "social-mcp": {
      "command": "node",
      "args": ["./social-mcp-server/dist/index.js"],
      "env": {
        "SOCIAL_MCP_API_URL": "${API_URL}"
      }
    }
  }
}`;

const steps = [
  {
    icon: Download,
    title: 'Download',
    description: 'Get the MCP server package',
  },
  {
    icon: Terminal,
    title: 'Install',
    description: 'Run npm install && npm run build',
  },
  {
    icon: Settings,
    title: 'Configure',
    description: 'Add to your AI client config',
  },
  {
    icon: MessageSquare,
    title: 'Connect',
    description: 'Start chatting with your AI!',
  },
];

// MCP Server source files embedded for download
const mcpServerFiles = {
  'package.json': `{
  "name": "social-mcp-server",
  "version": "1.0.0",
  "description": "Social MCP Server - Connect with people through your AI assistant",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "social-mcp": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}`,
  'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}`,
  'README.md': `# Social MCP Server

Connect with people through your AI assistant using the Model Context Protocol.

## Installation

\`\`\`bash
npm install
npm run build
\`\`\`

## Configuration

Add to your MCP client config (e.g., \`claude_desktop_config.json\`):

\`\`\`json
{
  "mcpServers": {
    "social-mcp": {
      "command": "node",
      "args": ["./social-mcp-server/dist/index.js"],
      "env": {
        "SOCIAL_MCP_API_URL": "${API_URL}"
      }
    }
  }
}
\`\`\`

## Available Tools

- **social_register** - Register your profile
- **social_set_intent** - Set what connections you're looking for
- **social_get_intents** - View your active intents
- **social_get_matches** - See your matches
- **social_respond_match** - Accept/reject matches
- **social_send_message** - Chat with matches
- **social_get_messages** - View chat history
- **social_get_notifications** - Check notifications

## Usage

Just talk to your AI! Examples:
- "Register me as Alex, a developer in NYC"
- "I'm looking for co-founders for an AI startup"
- "Check my matches"
- "Accept the match with profile xyz"
`,
  'src/index.ts': `#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const API_URL = process.env.SOCIAL_MCP_API_URL || '${API_URL}';

let apiKey: string | null = null;
let profileId: string | null = null;

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (apiKey) {
    headers['x-mcp-api-key'] = apiKey;
  }

  const response = await fetch(\`\${API_URL}/\${endpoint}\`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || \`API error: \${response.status}\`);
  }

  return data;
}

const server = new Server(
  {
    name: 'social-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'social_register',
        description: 'Register or update your Social MCP profile. Required before using other features.',
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
        description: 'Set what kind of connections you are looking for',
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
        description: 'Get your current active intents',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'social_get_matches',
        description: 'Get your current matches and pending introductions',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'social_respond_match',
        description: 'Accept or reject a match introduction',
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
        description: 'Send a message to a matched user',
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
        description: 'Get chat history with a matched user',
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
        description: 'Check for new notifications',
        inputSchema: { type: 'object', properties: {} },
      },
    ],
  };
});

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

        return {
          content: [{
            type: 'text',
            text: \`✅ Profile registered!\\n\\nProfile ID: \${profileId}\\n\\nYou can now set your intent with social_set_intent\`,
          }],
        };
      }

      case 'social_set_intent': {
        if (!apiKey) {
          return { content: [{ type: 'text', text: '❌ Please register first using social_register' }], isError: true };
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
          content: [{
            type: 'text',
            text: \`✅ Intent created!\\n\\nCategory: \${args?.category}\\nDescription: \${args?.description}\\n\\n\${result.message}\`,
          }],
        };
      }

      case 'social_get_intents': {
        if (!apiKey) {
          return { content: [{ type: 'text', text: '❌ Please register first' }], isError: true };
        }

        const result = await apiCall('mcp-intent', { method: 'GET' });

        if (!result.intents?.length) {
          return { content: [{ type: 'text', text: 'No active intents. Use social_set_intent to create one.' }] };
        }

        const list = result.intents.map((i: any) => \`• \${i.category}: \${i.description}\`).join('\\n');
        return { content: [{ type: 'text', text: \`📋 Your intents:\\n\\n\${list}\` }] };
      }

      case 'social_get_matches': {
        if (!apiKey) {
          return { content: [{ type: 'text', text: '❌ Please register first' }], isError: true };
        }

        const result = await apiCall('mcp-match', { method: 'GET' });

        if (!result.matches?.length) {
          return { content: [{ type: 'text', text: 'No matches yet. Keep your intents active!' }] };
        }

        const list = result.matches.map((m: any) => {
          const score = Math.round(m.match_score * 100);
          const status = m.status === 'accepted' ? '🟢 Connected' : 
                        m.requires_my_action ? '🟡 Awaiting response' : '⏳ Pending';
          return \`• **\${m.other_profile.display_name}** (\${score}% match)\\n  \${m.their_intent?.description}\\n  Status: \${status} | ID: \${m.id}\`;
        }).join('\\n\\n');

        return { content: [{ type: 'text', text: \`🤝 Matches:\\n\\n\${list}\` }] };
      }

      case 'social_respond_match': {
        if (!apiKey) {
          return { content: [{ type: 'text', text: '❌ Please register first' }], isError: true };
        }

        const result = await apiCall('mcp-match', {
          method: 'POST',
          body: JSON.stringify({ match_id: args?.match_id, action: args?.action }),
        });

        return { content: [{ type: 'text', text: \`\${args?.action === 'accept' ? '✅' : '❌'} \${result.message}\` }] };
      }

      case 'social_send_message': {
        if (!apiKey) {
          return { content: [{ type: 'text', text: '❌ Please register first' }], isError: true };
        }

        await apiCall(\`mcp-chat?match_id=\${args?.match_id}\`, {
          method: 'POST',
          body: JSON.stringify({ content: args?.content }),
        });

        return { content: [{ type: 'text', text: '✉️ Message sent!' }] };
      }

      case 'social_get_messages': {
        if (!apiKey) {
          return { content: [{ type: 'text', text: '❌ Please register first' }], isError: true };
        }

        const result = await apiCall(\`mcp-chat?match_id=\${args?.match_id}\`, { method: 'GET' });

        if (!result.messages?.length) {
          return { content: [{ type: 'text', text: 'No messages yet. Start the conversation!' }] };
        }

        const list = result.messages.map((m: any) => \`**\${m.is_mine ? 'You' : m.sender_name}**: \${m.content}\`).join('\\n');
        return { content: [{ type: 'text', text: \`💬 Chat:\\n\\n\${list}\` }] };
      }

      case 'social_get_notifications': {
        if (!apiKey) {
          return { content: [{ type: 'text', text: '❌ Please register first' }], isError: true };
        }

        const result = await apiCall('mcp-notifications', { method: 'GET' });

        if (!result.notifications?.length) {
          return { content: [{ type: 'text', text: '📭 No new notifications.' }] };
        }

        const list = result.notifications.map((n: any) => {
          const icon = n.type === 'new_match' ? '🎉' : n.type === 'match_accepted' ? '🤝' : n.type === 'new_message' ? '💬' : '📢';
          return \`\${icon} \${n.type.replace(/_/g, ' ')}\`;
        }).join('\\n');

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

  if (!apiKey) {
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ error: 'Not registered' }) }] };
  }

  try {
    if (uri === 'social://notifications') {
      const result = await apiCall('mcp-notifications', { method: 'GET' });
      return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(result) }] };
    }

    if (uri === 'social://matches') {
      const result = await apiCall('mcp-match', { method: 'GET' });
      return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(result) }] };
    }

    throw new Error('Unknown resource');
  } catch (error) {
    return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ error: String(error) }) }] };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Social MCP Server running on stdio');
}

main().catch(console.error);
`,
};

export const Installation = () => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(configExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setDownloading(true);
    
    try {
      const zip = new JSZip();
      const folder = zip.folder('social-mcp-server');
      
      if (folder) {
        // Add root files
        folder.file('package.json', mcpServerFiles['package.json']);
        folder.file('tsconfig.json', mcpServerFiles['tsconfig.json']);
        folder.file('README.md', mcpServerFiles['README.md']);
        
        // Add src folder
        const srcFolder = folder.folder('src');
        if (srcFolder) {
          srcFolder.file('index.ts', mcpServerFiles['src/index.ts']);
        }
      }
      
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'social-mcp-server.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section id="installation" className="relative py-32 px-6">
      <div className="container max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Get Started in <span className="gradient-text">Minutes</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Download, install, and start connecting. It's that simple.
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Step {index + 1}</div>
              <div className="font-semibold">{step.title}</div>
              <div className="text-sm text-muted-foreground">{step.description}</div>
            </div>
          ))}
        </motion.div>

        {/* Download Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-8 border border-border/50 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-display font-semibold mb-2">
                Social MCP Server
              </h3>
              <p className="text-muted-foreground">
                TypeScript/Node.js package • Compatible with Claude, ChatGPT, and more
              </p>
            </div>
            <Button 
              variant="hero" 
              size="lg" 
              onClick={handleDownload} 
              disabled={downloading}
              className="group shrink-0"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download Package
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Configuration Example */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-border/50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
            <div>
              <h4 className="font-semibold">Configuration Example</h4>
              <p className="text-sm text-muted-foreground">Add this to your MCP client config (e.g., claude_desktop_config.json)</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <pre className="p-6 overflow-x-auto text-sm">
            <code className="text-muted-foreground">{configExample}</code>
          </pre>
        </motion.div>

        {/* Quick commands */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <p className="text-muted-foreground mb-4">After downloading, run these commands:</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 font-mono text-sm">
            <Terminal className="w-4 h-4 text-primary" />
            <span>cd social-mcp-server && npm install && npm run build</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
