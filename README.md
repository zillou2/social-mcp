# Social MCP Server

> **The first social network of the AI era.** Connect with others through your AI assistant using the Model Context Protocol.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue.svg)](https://modelcontextprotocol.io)

---

## What is Social MCP?

Social MCP enables your AI assistant (Claude, ChatGPT, Gemini) to network on your behalf. Instead of scrolling feeds and sending connection requests, you tell your AI what you're looking for, and it finds compatible matches, facilitates introductions, and handles messaging—all through natural conversation.

### Key Principles

- **🤖 AI-Native** — Designed for AI assistants, not humans clicking buttons
- **🔒 Privacy-First** — Your profile is only shared with mutual matches
- **✋ Double Opt-In** — Both parties must accept before any introduction
- **🌐 Platform Agnostic** — Works with any MCP-compatible AI client

---

## Features

| Feature | Description |
|---------|-------------|
| **Profile Management** | Register and update your display name, bio, and location |
| **Intent-Based Matching** | Describe what you're looking for in natural language |
| **AI-Powered Matching** | Semantic matching finds complementary intents |
| **Double Opt-In Connections** | Both parties must accept before connecting |
| **Secure Messaging** | Send messages to matched connections |
| **Real-Time Notifications** | Get notified of new matches and messages via SSE |
| **Session Persistence** | Your identity persists across conversations |

---

## Quick Start (5 minutes)

### For Claude Desktop

1. **Download the MCP server** from [socialmcp.com](https://socialmcp.com)

2. **Extract and install dependencies:**
   ```bash
   cd mcp-server
   npm install
   npm run build
   ```

3. **Add to Claude Desktop config** (`~/Library/Application Support/Claude/claude_desktop_config.json` on Mac):
   ```json
   {
     "mcpServers": {
       "social-mcp": {
         "command": "node",
         "args": ["/absolute/path/to/mcp-server/dist/index.js"],
         "env": {
           "SOCIAL_MCP_API_URL": "https://cwaozizmiipxstlwmepk.supabase.co/functions/v1"
         }
       }
     }
   }
   ```

4. **Restart Claude Desktop** and start chatting:
   > "Register me on Social MCP as John Doe. I'm a startup founder looking for a technical co-founder."

---

## Installation Methods

### Method 1: Local STDIO Server (Recommended for Claude Desktop)

Best for: Claude Desktop users who want the simplest setup.

```bash
# Clone or download
git clone https://github.com/yourusername/social-mcp.git
cd social-mcp/mcp-server

# Install and build
npm install
npm run build

# The server runs automatically when Claude Desktop starts
```

**Pros:** Simple, no deployment needed, credentials stored locally  
**Cons:** Only works with STDIO-based clients (Claude Desktop)

### Method 2: Hosted HTTP Server (For Claude Web & Push Notifications)

Best for: Claude Web users, or anyone wanting real-time push notifications.

The HTTP server provides Server-Sent Events (SSE) for real-time notifications when you receive new matches or messages.

```bash
# Build and run locally
npm install
npm run build
npm run start:http

# Or deploy to a cloud provider (see Deployment section)
```

Then configure your MCP client to connect to the HTTP endpoint.

### Method 3: Direct Edge Function Access

Best for: Developers building custom integrations.

You can call the edge function directly without using the MCP server:

```bash
curl -X POST https://cwaozizmiipxstlwmepk.supabase.co/functions/v1/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"social_register","arguments":{"display_name":"John"}},"id":1}'
```

---

## Configuration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "social-mcp": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "SOCIAL_MCP_API_URL": "https://cwaozizmiipxstlwmepk.supabase.co/functions/v1"
      }
    }
  }
}
```

### Claude Web (via mcp-remote or Hosted Server)

For Claude Web, you need the HTTP server running somewhere accessible:

```json
{
  "mcpServers": {
    "social-mcp": {
      "command": "npx",
      "args": ["mcp-remote", "https://your-deployed-server.com/mcp"]
    }
  }
}
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SOCIAL_MCP_API_URL` | No | `https://cwaozizmiipxstlwmepk.supabase.co/functions/v1` | Backend API endpoint |
| `SUPABASE_URL` | For HTTP | — | Supabase project URL (for realtime) |
| `SUPABASE_ANON_KEY` | For HTTP | — | Supabase anonymous key (for realtime) |
| `PORT` | No | `3000` | HTTP server port |

---

## Available Tools

### `social_register`

Register a new profile or update your existing profile.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `display_name` | string | Yes | Your display name |
| `bio` | string | No | A brief bio about yourself |
| `location` | string | No | Your location |

**Example:**
```
User: "Register me on Social MCP as Sarah Chen. I'm a product designer based in San Francisco."
```

**Response:**
```json
{
  "success": true,
  "profile_id": "uuid-here",
  "api_key": "smcp_xxxxx",
  "message": "Welcome to Social MCP, Sarah Chen!"
}
```

---

### `social_login`

Log in to an existing profile using your API key.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `api_key` | string | Yes | Your API key from registration |

**Example:**
```
User: "Log me into Social MCP with my API key smcp_xxxxx"
```

---

### `social_whoami`

Check your current logged-in profile.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| — | — | — | No parameters required |

**Example:**
```
User: "Who am I on Social MCP?"
```

---

### `social_set_intent`

Set what kind of connections you're looking for. This is the core of matching.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | Yes | One of: `professional`, `romance`, `friendship`, `expertise`, `sports`, `learning`, `other` |
| `description` | string | Yes | Natural language description of what you're looking for |
| `criteria` | object | No | Additional structured criteria (key-value pairs) |

**Example:**
```
User: "I'm looking for a technical co-founder for my AI startup. 
       They should have ML experience and be willing to work full-time."
```

**AI uses:**
```json
{
  "category": "professional",
  "description": "Looking for a technical co-founder for AI startup with ML experience, willing to work full-time",
  "criteria": {
    "role": "technical co-founder",
    "skills": ["ML", "AI"],
    "commitment": "full-time"
  }
}
```

---

### `social_get_intents`

Get all your active intents.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| — | — | — | No parameters required |

---

### `social_find_matches`

Actively search for matches based on your current intents.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| — | — | — | No parameters required |

**Returns:** List of potential matches ranked by compatibility score.

---

### `social_get_matches`

Get your current matches and their status.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| — | — | — | No parameters required |

**Match Statuses:**
- `pending_a` — Fresh match, awaiting first response from profile A
- `pending_b` — Profile A accepted, awaiting response from profile B
- `accepted` — Both parties accepted, connection established!
- `rejected` — One party declined
- `expired` — Match expired (7 days without response)

---

### `social_respond_match`

Accept or reject a potential match.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `match_id` | string | Yes | The match UUID |
| `action` | string | Yes | Either `accept` or `reject` |

**Example:**
```
User: "Accept the match with Sarah Chen"
```

---

### `social_send_message`

Send a message to a connected match.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `match_id` | string | Yes | The match UUID |
| `content` | string | Yes | Your message content |

**Example:**
```
User: "Send a message to Sarah: 'Hi! I'd love to chat about your startup idea.'"
```

---

### `social_get_messages`

Get the message history with a match.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `match_id` | string | Yes | The match UUID |

---

### `social_get_notifications`

Check for new notifications (matches, messages, etc.).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| — | — | — | No parameters required |

**Returns:** Summary of pending matches, connection requests, active connections, and unread messages.

---

## Complete Workflow Example

Here's a complete conversation showing the Social MCP flow:

### 1. Registration

> **You:** "I want to use Social MCP. Register me as Alex Rivera, a software engineer in Austin interested in finding co-founders."

> **Claude:** I'll register you on Social MCP.
> 
> ✅ **Welcome to Social MCP, Alex Rivera!**
> 
> Your profile is now active. I've saved your API key securely. Now let's set what you're looking for...

### 2. Setting Intent

> **You:** "I'm looking for a business-minded co-founder for a developer tools startup. Someone with sales or marketing experience who understands developers."

> **Claude:** I've set your intent:
> 
> 📌 **Intent Active:** Professional networking
> - Looking for: Business co-founder with sales/marketing experience
> - For: Developer tools startup
> 
> I'll monitor for compatible matches!

### 3. Checking Matches

> **You:** "Do I have any matches yet?"

> **Claude:** Let me check your matches...
> 
> 🎉 **2 New Potential Matches:**
> 
> 1. **Jordan Kim** (87% match)
>    *"Former DevRel at Stripe, looking to join early-stage devtools startup as business co-founder"*
> 
> 2. **Morgan Chen** (72% match)
>    *"Marketing lead seeking technical co-founder for B2B SaaS"*
> 
> Would you like to accept any of these?

### 4. Accepting a Match

> **You:** "Accept the match with Jordan Kim"

> **Claude:** ✅ **Match accepted!**
> 
> Jordan has been notified. Once they accept, you'll be connected and can start messaging.

### 5. Connection Established

> **You:** "Check my notifications"

> **Claude:** 🎉 **Great news!**
> 
> Jordan Kim accepted your connection! You're now connected.
> 
> Would you like me to send them a message to introduce yourself?

### 6. Messaging

> **You:** "Yes, send them: 'Hi Jordan! I saw your DevRel background at Stripe - that's exactly the kind of experience I'm looking for. Would love to chat about the devtools space. Free for a call this week?'"

> **Claude:** ✅ **Message sent to Jordan Kim!**
> 
> I'll let you know when they reply.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User's AI Client                        │
│                  (Claude Desktop / ChatGPT / etc.)              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ MCP Protocol (STDIO or HTTP)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Social MCP Server                          │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │  STDIO Server   │    │   HTTP Server   │                     │
│  │  (index.ts)     │    │ (http-server.ts)│                     │
│  │                 │    │                 │                     │
│  │ • Tool handlers │    │ • SSE push      │                     │
│  │ • Credential    │    │ • Session mgmt  │                     │
│  │   storage       │    │ • Realtime sub  │                     │
│  └────────┬────────┘    └────────┬────────┘                     │
│           │                      │                               │
│           └──────────┬───────────┘                               │
│                      │                                           │
└──────────────────────┼───────────────────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Edge Function                         │
│                  (supabase/functions/mcp)                        │
│                                                                  │
│  • JSON-RPC request handling                                     │
│  • Profile & intent management                                   │
│  • Match creation & status updates                               │
│  • Message storage & retrieval                                   │
│  • Notification generation                                       │
└─────────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                         │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐     │
│  │ profiles │  │ intents  │  │ matches  │  │ messages     │     │
│  ├──────────┤  ├──────────┤  ├──────────┤  ├──────────────┤     │
│  │ id       │  │ id       │  │ id       │  │ id           │     │
│  │ name     │◄─┤ profile  │◄─┤ profile_a│  │ match_id     │     │
│  │ bio      │  │ category │  │ profile_b│  │ sender_id    │     │
│  │ location │  │ desc     │  │ intent_a │  │ content      │     │
│  └──────────┘  │ criteria │  │ intent_b │  │ created_at   │     │
│                └──────────┘  │ score    │  └──────────────┘     │
│                              │ status   │                        │
│  ┌──────────────────┐        └──────────┘                        │
│  │ notifications    │                                            │
│  ├──────────────────┤        ┌──────────────┐                    │
│  │ id               │        │ mcp_api_keys │                    │
│  │ profile_id       │        ├──────────────┤                    │
│  │ type             │        │ key_hash     │                    │
│  │ payload          │        │ profile_id   │                    │
│  │ is_delivered     │        │ scopes       │                    │
│  └──────────────────┘        └──────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles with display name, bio, location |
| `intents` | What users are looking for (category + description) |
| `matches` | Connections between two users with acceptance status |
| `messages` | Chat messages between matched users |
| `notifications` | Pending notifications for async delivery |
| `mcp_api_keys` | Hashed API keys for authentication |
| `mcp_sessions` | HTTP session management for stateful connections |

---

## Privacy & Security

### Double Opt-In System

```
User A sets intent     User B sets intent
       │                      │
       └──────────┬───────────┘
                  ▼
           Matching Engine
           finds compatibility
                  │
                  ▼
    ┌─────────────────────────┐
    │ Match created (pending) │
    └─────────────────────────┘
                  │
       ┌──────────┴──────────┐
       ▼                     ▼
   User A sees           User B doesn't
   match, accepts        see anything yet
       │
       ▼
   User B NOW sees
   connection request
       │
       ▼
   User B accepts
       │
       ▼
   ✅ CONNECTED!
   Both can message
```

### Data Protection

- **Hashed API Keys** — Keys are stored as SHA-256 hashes, never plaintext
- **Minimal Data Sharing** — Only display name and intent are shared with matches
- **No Browsing** — Users can't browse all profiles, only see their matches
- **Expiring Matches** — Unresponded matches expire after 7 days
- **Row-Level Security** — Database policies restrict data access

### Authentication Methods

1. **API Key** — Generated at registration, stored locally by the STDIO server
2. **Session ID** — For HTTP server, persisted across requests
3. **Profile ID** — Fallback for legacy compatibility

---

## Deployment

### Railway (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

Set environment variables in Railway dashboard:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login and deploy
fly auth login
fly launch
fly deploy
```

### Docker

```bash
# Build
docker build -t social-mcp-server .

# Run
docker run -p 3000:3000 \
  -e SUPABASE_URL=your-url \
  -e SUPABASE_ANON_KEY=your-key \
  social-mcp-server
```

### Render

1. Create a new Web Service
2. Connect your repository
3. Set build command: `npm install && npm run build`
4. Set start command: `npm run start:http`
5. Add environment variables

---

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Local Setup

```bash
# Clone repository
git clone https://github.com/yourusername/social-mcp.git
cd social-mcp/mcp-server

# Install dependencies
npm install

# Build
npm run build

# Run STDIO server (for testing with Claude Desktop)
node dist/index.js

# Run HTTP server (for web clients)
npm run start:http
```

### Project Structure

```
mcp-server/
├── src/
│   ├── index.ts        # STDIO server for Claude Desktop
│   └── http-server.ts  # HTTP server with SSE for web clients
├── dist/               # Compiled JavaScript
├── package.json
├── tsconfig.json
├── Dockerfile
├── fly.toml            # Fly.io configuration
├── README.md
└── DEPLOY.md           # Detailed deployment guide
```

### Building from Source

```bash
npm run build
```

This compiles TypeScript from `src/` to `dist/`.

---

## Troubleshooting

### "Tool not found" in Claude

**Cause:** MCP server not configured correctly.

**Solution:**
1. Check the path in `claude_desktop_config.json` is absolute and correct
2. Ensure `npm run build` completed successfully
3. Restart Claude Desktop completely

### "Authentication failed"

**Cause:** Invalid or expired API key.

**Solution:**
1. Re-register to get a new API key
2. Or use `social_login` with your existing key

### "No matches found"

**Cause:** No compatible intents in the system.

**Solution:**
1. Ensure your intent is set (`social_set_intent`)
2. Use `social_find_matches` to trigger a new search
3. Wait for more users to join!

### HTTP server not receiving notifications

**Cause:** Supabase realtime not configured.

**Solution:**
1. Ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
2. Check that realtime is enabled for `notifications` and `messages` tables

### Credentials lost between sessions

**Cause:** Credentials file not persisted (containerized environments).

**Solution:**
1. For Docker: Mount a volume for `~/.social-mcp-credentials.json`
2. Or use the HTTP server which uses database sessions

---

## API Reference

### Backend Endpoint

```
POST https://cwaozizmiipxstlwmepk.supabase.co/functions/v1/mcp
```

### Request Format (JSON-RPC 2.0)

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "social_register",
    "arguments": {
      "display_name": "John Doe"
    }
  },
  "id": 1
}
```

### Authentication Headers

| Header | Description |
|--------|-------------|
| `x-mcp-api-key` | Your API key (preferred) |
| `x-mcp-profile-id` | Profile UUID (fallback) |
| `mcp-session-id` | HTTP session ID |

### Response Format

```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Success message here"
      }
    ]
  },
  "id": 1
}
```

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Links

- **Website:** [www.social-mcp.org](https://www.social-mcp.org)
- **MCP Specification:** [modelcontextprotocol.io](https://modelcontextprotocol.io)

---

<p align="center">
  <strong>Built for the AI era. 🤖💬</strong>
</p>
