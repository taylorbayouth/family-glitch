# AI System Documentation

A robust, modular system for ChatGPT API (GPT-5.2) with tool use, built for Vercel/Next.js.

## Features

- ✅ GPT-5.2 with OpenAI Responses API
- ✅ Server-side tool execution
- ✅ Modular tool registry
- ✅ Easy configuration (temperature, model, reasoning effort)
- ✅ Type-safe with TypeScript
- ✅ React hooks for client-side usage
- ✅ Non-streaming (with streaming ready to add)

## Quick Start

### 1. Set up environment variables

```bash
cp .env.example .env.local
# Add your OpenAI API key to .env.local
```

### 2. Use in a React component

```tsx
'use client';

import { useChat } from '@/lib/ai/client';

export default function MyComponent() {
  const { messages, sendMessage, isLoading } = useChat();

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>{msg.content}</div>
      ))}
      <button onClick={() => sendMessage('Hello!')}>
        Send
      </button>
    </div>
  );
}
```

### 3. Or use the simple API

```tsx
import { chat } from '@/lib/ai/client';

// Simple one-off request
const response = await chat('What is 2+2?', {
  temperature: 0.0,
  tools: ['calculate'],
});
```

## Architecture

```
lib/ai/
├── types.ts                      # TypeScript definitions
├── config.ts                     # Configuration & defaults
├── tools.ts                      # Tool registry & tool definitions
├── template-tools.ts             # Input template tools (NEW)
├── game-master-prompt.ts         # Game master system prompt builder (NEW)
├── game-integration-example.ts   # Complete game flow examples (NEW)
├── client.ts                     # Client-side utilities & hooks
└── README.md                     # This file

app/api/chat/
└── route.ts                      # API endpoint (tool execution happens here)
```

## Configuration

### Available Options

```typescript
interface AIRequestConfig {
  model?: string;              // Default: 'gpt-5.2'
  temperature?: number;        // Default: 0.7 (0.0-1.0)
  maxTokens?: number;          // Default: 4096
  tools?: string[];            // Tool names to enable (empty = all)
  reasoningEffort?: string;    // 'low' | 'medium' | 'high' | 'xhigh'
  stream?: boolean;            // Default: true (not yet implemented)
}
```

### Configuration Examples

```typescript
// Precise, deterministic responses
useChat({
  temperature: 0.0,
  reasoningEffort: 'low',
});

// Creative writing
useChat({
  temperature: 1.0,
  reasoningEffort: 'medium',
});

// Complex reasoning tasks
useChat({
  temperature: 0.5,
  reasoningEffort: 'xhigh',
});

// Specific tools only
useChat({
  tools: ['calculate', 'get_current_time'],
});
```

### Temperature Presets

```typescript
import { TEMPERATURE_PRESETS } from '@/lib/ai/config';

useChat({
  temperature: TEMPERATURE_PRESETS.PRECISE,   // 0.0
  temperature: TEMPERATURE_PRESETS.BALANCED,  // 0.7
  temperature: TEMPERATURE_PRESETS.CREATIVE,  // 1.0
});
```

## Creating Tools

### Tool Structure

A tool has two parts:
1. **Definition** (JSON schema) - sent to the API
2. **Executor** (function) - runs server-side when called

### Example Tool

```typescript
// In lib/ai/tools.ts

import { registerTool } from './tools';

registerTool<{ city: string }>(
  {
    type: 'function',
    name: 'get_weather',
    description: 'Get current weather for a city',
    parameters: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'City name',
        },
      },
      required: ['city'],
      additionalProperties: false,
    },
  },
  async ({ city }) => {
    // Your actual implementation
    const response = await fetch(
      `https://api.weather.com/current?city=${city}`
    );
    return response.json();
  }
);
```

### Best Practices for Tools

1. **Strict schemas** - Don't allow arbitrary properties
2. **Clear descriptions** - Help the model know when to use the tool
3. **Error handling** - Return errors as JSON, don't throw
4. **Type safety** - Use TypeScript generics for type-safe args
5. **Server-side only** - Never expose sensitive APIs to the client

### Example: Database Tool

```typescript
registerTool<{ userId: string }>(
  {
    type: 'function',
    name: 'get_user_profile',
    description: 'Fetch user profile from database',
    parameters: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['userId'],
      additionalProperties: false,
    },
  },
  async ({ userId }) => {
    try {
      // Your database call
      const user = await db.users.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return { error: 'User not found' };
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
      };
    } catch (error) {
      return { error: 'Database error' };
    }
  }
);
```

## API Reference

### `useChat(config?)`

React hook for chat with state management.

**Returns:**
- `messages` - Array of chat messages
- `isLoading` - Boolean loading state
- `error` - Error message (if any)
- `sendMessage(content, config?)` - Send a message
- `clearMessages()` - Clear chat history
- `setMessages(msgs)` - Set messages manually

**Example:**
```tsx
const { messages, sendMessage, clearMessages } = useChat({
  temperature: 0.7,
});
```

### `chat(message, config?)`

Simple one-off request without state.

**Example:**
```typescript
const response = await chat('Hello!', {
  model: 'gpt-5.2',
  temperature: 0.5,
});
```

### `sendChatRequest(messages, config?)`

Lower-level API for custom implementations.

**Example:**
```typescript
import { sendChatRequest } from '@/lib/ai/client';

const response = await sendChatRequest([
  { role: 'user', content: 'Hello!' },
], {
  temperature: 0.7,
});
```

## Tool Execution Flow

1. Client sends messages to `/api/chat`
2. Server calls OpenAI Responses API
3. If model returns tool calls:
   - Execute tools server-side
   - Send results back to model
   - Repeat until no more tool calls
4. Return final text response to client

```
Client          API Route         OpenAI          Tools
  |                |                 |               |
  |---messages---->|                 |               |
  |                |----request----->|               |
  |                |<---tool_call----|               |
  |                |-------------execute------------>|
  |                |<------------result--------------|
  |                |----result------>|               |
  |                |<---response-----|               |
  |<---text--------|                 |               |
```

## Security

- ✅ API key in environment variables
- ✅ Server-side tool execution only
- ✅ No client-side API exposure
- ✅ Strict JSON schemas for tools
- ✅ Error handling with safe error messages

**TODO:**
- [ ] Add rate limiting (Vercel KV / Upstash)
- [ ] Add request validation/sanitization
- [ ] Add authentication for API routes
- [ ] Add logging/monitoring

## Testing

Test the system:

```bash
# Start dev server
npm run dev

# Visit the demo page
open http://localhost:3000/chat
```

Try these prompts:
- "What time is it?"
- "Calculate 123 * 456"
- "Look up customer@example.com"

## Streaming (Not Yet Implemented)

To add streaming:

1. Use `openai.responses.create({ stream: true })`
2. Return a `ReadableStream` from the API route
3. Use `EventSource` or `fetch` with streaming on client
4. Buffer tool calls until complete, then execute

See OpenAI's streaming docs for details.

## Troubleshooting

**"OpenAI client not initialized"**
- Check that `OPENAI_API_KEY` is set in `.env.local`
- Restart the dev server after adding env vars

**"Tool not found"**
- Make sure the tool is registered in `lib/ai/tools.ts`
- Check that the tool name matches exactly

**"Max tool execution iterations reached"**
- A tool is likely returning invalid data
- Check tool executor error handling
- Increase `MAX_ITERATIONS` in route.ts if needed

## Examples

See [/app/chat/page.tsx](/app/chat/page.tsx) for a complete working example.

## Family Glitch Game Integration

### Template Tools

Six specialized tools for collecting player input during gameplay:

| Tool | Purpose | Example |
|------|---------|---------|
| `ask_for_text` | Detailed paragraph responses | "Describe your most embarrassing moment" |
| `ask_for_list` | Multiple short answers | "Name 3 things in your pocket" |
| `ask_binary_choice` | Timed "this or that" | "Pizza or Tacos? (5 seconds)" |
| `ask_word_selection` | Select words from grid | "Select 3 words that describe Dad" |
| `ask_rating` | Numeric scale rating | "How hungry are you? (0-10)" |
| `ask_player_vote` | Vote for another player | "Who's the worst driver?" |

### Game Master System

The AI acts as a snarky, witty game master that:
- Asks probing questions using the template tools
- Provides commentary on player responses
- Awards points strategically
- Creates moments of tension and laughter

**Usage:**

```typescript
import { buildGameMasterPrompt } from '@/lib/ai/game-master-prompt';
import { sendChatRequest } from '@/lib/ai/client';

// Build system prompt with player data
const systemPrompt = buildGameMasterPrompt(players, gameState);

// Start conversation
const messages = [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: 'Start the game and ask the first question.' },
];

// AI will call one of the template tools
const response = await sendChatRequest(messages);
```

### Complete Game Flow Example

See [game-integration-example.ts](./game-integration-example.ts) for:
- Starting a new game
- Handling player responses
- Managing conversation history
- React hooks for game sessions
- Complete game loop implementation

### Template Tool Responses

When the AI calls a template tool, it returns configuration for rendering:

```json
{
  "templateType": "tpl_slider",
  "prompt": "How hungry are you right now?",
  "params": {
    "min": 0,
    "max": 10,
    "minLabel": "Not hungry",
    "maxLabel": "STARVING"
  }
}
```

Use this with the `TemplateRenderer` component:

```tsx
import { TemplateRenderer } from '@/components/input-templates';

<TemplateRenderer
  templateType={response.templateType}
  params={{
    ...response.params,
    onSubmit: handlePlayerResponse
  }}
/>
```

## Resources

- [OpenAI Responses API Docs](https://platform.openai.com/docs/api-reference/responses)
- [Function Calling Guide](https://platform.openai.com/docs/guides/function-calling)
- [GPT-5.2 Announcement](https://openai.com/gpt-5.2)
- [Input Templates Documentation](../../docs/INPUT_TEMPLATES_SYSTEM.md)
- [AI Template Guide](../../docs/AI_TEMPLATE_GUIDE.md)
