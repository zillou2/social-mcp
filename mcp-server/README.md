# Social MCP Server

The **Social MCP Server** is the first social network of the AI era. It enables users to connect with others through their AI chat interfaces (ChatGPT, Claude, Gemini, etc.) using the Model Context Protocol (MCP).

## Overview

Social MCP allows AI assistants to:
1. Register user profiles and intents
2. Find matches based on complementary needs
3. Facilitate double-opt-in introductions
4. Enable direct messaging between matched users

## Installation

```bash
cd mcp-server
npm install
npm run build
```

## Configuration

Add to your MCP client configuration:

### For Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

### For Other MCP Clients

Set the environment variable:
```bash
SOCIAL_MCP_API_URL=https://cwaozizmiipxstlwmepk.supabase.co/functions/v1
```

## Available Tools

### `social_register`
Register or update your Social MCP profile.

**Parameters:**
- `display_name` (string): Your display name
- `bio` (string): A brief bio about yourself
- `location` (string, optional): Your location

### `social_set_intent`
Set what kind of connections you're looking for.

**Parameters:**
- `category` (string): One of: professional, romance, friendship, expertise, sports, learning, other
- `description` (string): Natural language description of what you're looking for
- `criteria` (object, optional): Additional structured criteria

### `social_get_matches`
Get your current matches and pending introductions.

### `social_respond_match`
Accept or reject a match.

**Parameters:**
- `match_id` (string): The match ID
- `action` (string): "accept" or "reject"

### `social_send_message`
Send a message to a matched user.

**Parameters:**
- `match_id` (string): The match ID
- `content` (string): Your message

### `social_get_messages`
Get chat history with a matched user.

**Parameters:**
- `match_id` (string): The match ID

### `social_get_notifications`
Check for new notifications (matches, messages, etc.)

## Resources (for MCP resource subscriptions)

### `social://notifications`
Subscribe to real-time notifications about matches and messages.

### `social://matches`
Subscribe to updates about your matches.

## Example Conversation

**User:** "Enable Social MCP and help me find a co-founder for my AI startup"

**AI:** I'll set up your Social MCP profile. First, let me register you...
*[Uses social_register tool]*

Now I'll set your intent to find a co-founder...
*[Uses social_set_intent with category="professional"]*

Your profile is active! I'll notify you when potential co-founders match with your profile.

---

**User:** "Check if I have any matches"

**AI:** *[Uses social_get_matches tool]*

You have 2 potential matches:
1. **Sarah** (85% match) - Looking for technical co-founder for fintech startup
2. **Alex** (72% match) - AI researcher seeking startup opportunities

Would you like me to accept either of these introductions?

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   AI Client     │────▶│  Social MCP      │────▶│  Backend API    │
│ (Claude, GPT)   │     │  Server (local)  │     │  (Edge Funcs)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                                                  ┌─────────────────┐
                                                  │   Database      │
                                                  │   (Postgres)    │
                                                  └─────────────────┘
```

## Privacy

- Profile data is only shared with mutual matches
- All communications are end-to-end between matched parties
- Users control exactly what information is shared
- Double-opt-in ensures both parties consent before introductions

## License

MIT
