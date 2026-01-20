# AI System Documentation

This is the AI integration layer for Family Glitch. It uses OpenAI Chat Completions with tool calling, a tool registry, and a client API wrapper for Next.js.

## What It Does

- Calls GPT-5.2 via `openai.chat.completions.create()`
- Supports tool calling with a server-side execution loop
- Returns template configs for input templates and mini-games
- Provides client hooks (`useChat`) and a low-level `sendChatRequest`

## Key Files

```
lib/ai/
  client.ts           # sendChatRequest + useChat
  config.ts           # defaults + model presets
  tools.ts            # ToolRegistry (lazy loads template tools)
  template-tools.ts   # Input template tools + mini-game triggers
  game-master-prompt.ts
  announcer-prompt.ts
  types.ts
```

API route:
- `app/api/chat/route.ts`

## Configuration

`AIRequestConfig` fields (see `lib/ai/types.ts`):

```ts
interface AIRequestConfig {
  model?: string;             // default: gpt-5.2
  temperature?: number;       // default: 0.7
  maxTokens?: number;         // default: 4096
  tools?: string[];           // tool names to enable (empty = all)
  toolChoice?: 'auto' | 'required' | 'none';
  reasoningEffort?: 'low' | 'medium' | 'high' | 'xhigh';
  stream?: boolean;           // present in config, not used by the API route
}
```

Notes:
- `/api/chat` ignores `stream` today (non-streaming only).
- `/play` uses `toolChoice: 'required'` for questions and `toolChoice: 'none'` for commentary.

## Tool Execution Flow

1. Client sends messages to `/api/chat`.
2. Server calls GPT-5.2 with tool definitions.
3. If tool calls are returned, the server executes them.
4. For template tools, the API returns the tool result immediately as JSON string in `text`.
5. For non-template tools, results are appended and the model is called again.

## Template Tools

Defined in `lib/ai/template-tools.ts`:

Input templates:
- `ask_for_text`
- `ask_for_list`
- `ask_binary_choice`
- `ask_word_selection`
- `ask_rating`
- `ask_player_vote`

Mini-game triggers:
- `trigger_trivia_challenge`
- `trigger_personality_match`
- `trigger_madlibs_challenge`
- `trigger_cryptic_connection`
- `trigger_hard_trivia`

## Client Usage

### sendChatRequest

```ts
import { sendChatRequest } from '@/lib/ai/client';

const response = await sendChatRequest([
  { role: 'user', content: 'Hello' },
]);

// response.text is the assistant output
```

### useChat hook

```tsx
'use client';

import { useChat } from '@/lib/ai/client';

export function ChatDemo() {
  const { messages, sendMessage, isLoading } = useChat({
    temperature: 0.7,
    reasoningEffort: 'medium',
  });

  return (
    <button onClick={() => sendMessage('Hello')}>Send</button>
  );
}
```

## Template Tool Responses

Template tools return JSON configs that the client renders:

```json
{
  "templateType": "tpl_slider",
  "prompt": "How hungry are you?",
  "params": { "min": 0, "max": 10 }
}
```

In `/play`, the response text is parsed and passed into `TemplateRenderer`.

## API Endpoints

- `POST /api/chat` -> AI chat with tool execution loop
- `GET /api/chat` -> returns tool names and model

## Troubleshooting

- "OPENAI_API_KEY is not set" -> check `.env.local` and restart dev server
- Tool not found -> make sure it is registered in `template-tools.ts`
- Invalid JSON -> tools must return valid JSON; the API logs parsing errors

## Related Docs

- `docs/GAME_MASTER_SETUP.md`
- `docs/AI_TEMPLATE_GUIDE.md`
- `docs/INPUT_TEMPLATES_SYSTEM.md`
