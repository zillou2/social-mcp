# Social MCP Server - Deployable HTTP Server

A hosted MCP server with **real-time push notifications** via Supabase Realtime.

## Why This Exists

The `mcp-remote` bridge + Supabase Edge Functions can't maintain persistent SSE connections (edge functions timeout after ~150s). This HTTP server solves that by:

1. Running as a long-lived Node.js process
2. Connecting to Supabase Realtime for push notifications
3. Maintaining SSE connections to MCP clients

## Deploy Options

### Option 1: Railway (Recommended)

```bash
cd mcp-server
npm install && npm run build

# Push to GitHub, then:
# 1. Go to railway.app
# 2. New Project → Deploy from GitHub
# 3. Select your repo, set root directory to "mcp-server"
# 4. Add environment variables (see below)
# 5. Deploy!
```

### Option 2: Fly.io

```bash
cd mcp-server
npm install && npm run build

# Install flyctl if needed: curl -L https://fly.io/install.sh | sh
fly launch
fly deploy
```

### Option 3: Render

1. Create a new Web Service on render.com
2. Connect your GitHub repo
3. Set build command: `npm install && npm run build`
4. Set start command: `npm run start:http`
5. Add environment variables

### Option 4: Docker (Self-hosted)

```bash
cd mcp-server
npm install && npm run build
docker build -t social-mcp-server .
docker run -p 3000:3000 social-mcp-server
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | HTTP server port |
| `SOCIAL_MCP_API_URL` | No | `https://cwaozizmiipxstlwmepk.supabase.co/functions/v1` | Backend API URL |
| `SUPABASE_URL` | No | `https://cwaozizmiipxstlwmepk.supabase.co` | Supabase project URL |
| `SUPABASE_ANON_KEY` | No | (embedded) | Supabase anon key |

## Claude Desktop Configuration

Once deployed, configure Claude Desktop:

```json
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
```

Replace `your-deployed-server.fly.dev` with your actual deployment URL.

## How Push Notifications Work

```
┌─────────────────┐     SSE (persistent)     ┌──────────────────┐
│  Claude Desktop │◄────────────────────────►│  HTTP MCP Server │
│   (mcp-remote)  │     JSON-RPC (POST)      │   (this server)  │
└─────────────────┘                          └────────┬─────────┘
                                                      │
                                                      │ Realtime
                                                      │ WebSocket
                                                      ▼
                                             ┌──────────────────┐
                                             │     Supabase     │
                                             │    (Database)    │
                                             └──────────────────┘
```

1. Client connects via GET → receives SSE stream
2. Client sends commands via POST → JSON-RPC
3. Server subscribes to Supabase Realtime for this profile
4. When new messages/notifications arrive, server pushes via SSE

## Local Development

```bash
cd mcp-server
npm install
npm run dev:http
```

Server runs at `http://localhost:3000/mcp`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/mcp` | SSE stream for push notifications |
| POST | `/mcp` | JSON-RPC handler for MCP commands |
| DELETE | `/mcp` | Terminate session |
| GET | `/health` | Health check |
