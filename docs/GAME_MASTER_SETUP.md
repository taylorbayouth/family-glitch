# Game Master Setup Guide

Complete guide for integrating the AI Game Master with the input template system.

## Overview

The Family Glitch game uses a sophisticated AI system where ChatGPT acts as a "Game Master" that:
1. Selects appropriate input templates using **tool calls**
2. Receives player responses
3. Provides witty, snarky commentary
4. Awards points and tracks game state

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Game UI                             │
│  (Player sees templates, submits responses)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Game State Management                           │
│  (Zustand stores: player data, game state, turns)          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            Chat API (/api/chat)                              │
│  - Receives messages                                        │
│  - Calls OpenAI with tools                                  │
│  - Executes tool calls server-side                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  OpenAI GPT-5.2                              │
│  - Game Master personality                                  │
│  - Calls template tools                                     │
│  - Generates commentary                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Template Tools                                  │
│  - ask_for_text                                             │
│  - ask_for_list                                             │
│  - ask_binary_choice                                        │
│  - ask_word_selection                                       │
│  - ask_rating                                               │
│  - ask_player_vote                                          │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Template Tools ([lib/ai/template-tools.ts](../lib/ai/template-tools.ts))

Six tools that the AI can call to collect player input:

**Each tool:**
- Has a detailed description that guides the AI on when to use it
- Returns template configuration (not rendered HTML)
- Includes parameter validation in the JSON schema

**Example Tool Definition:**

```typescript
{
  type: 'function',
  name: 'ask_binary_choice',
  description: 'Ask the current player to make a quick "This or That" decision...',
  parameters: {
    type: 'object',
    properties: {
      prompt: { type: 'string', description: 'The question to ask' },
      leftText: { type: 'string', description: 'Text for left option' },
      rightText: { type: 'string', description: 'Text for right option' },
      seconds: { type: 'number', minimum: 3, maximum: 30 }
    },
    required: ['prompt', 'leftText', 'rightText', 'seconds']
  }
}
```

### 2. Game Master Prompt ([lib/ai/game-master-prompt.ts](../lib/ai/game-master-prompt.ts))

Builds the system prompt dynamically with:
- Game context (new game vs ongoing)
- Player roster (names, roles, ages)
- Current scores
- Recent turns (for continuity)
- Personality instructions

**Key features:**
- Tool descriptions are NOT in the prompt (they're in the tool schemas)
- Prompt tells AI to "choose one of the available tools"
- Includes tone guidelines and example opening

### 3. Template Renderer ([components/input-templates/](../components/input-templates/))

React components that render the templates:
- Receives configuration from AI tool call
- Handles user interaction
- Returns structured response data

## Complete Flow Example

### Step 1: Initialize Game

```typescript
import { buildGameMasterPrompt } from '@/lib/ai/game-master-prompt';
import { usePlayerStore, useGameStore } from '@/lib/store';

const { players } = usePlayerStore();
const { gameId, turns, scores } = useGameStore();

// Build system prompt
const systemPrompt = buildGameMasterPrompt(players, {
  gameId,
  turns,
  scores,
  status: 'playing'
});
```

### Step 2: Start Conversation

```typescript
import { sendChatRequest } from '@/lib/ai/client';

const messages = [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: 'Start the game and ask the first player a question.' }
];

const response = await sendChatRequest(messages);
```

### Step 3: AI Calls Template Tool

The AI will call one of the template tools, e.g.:

```json
{
  "tool_calls": [{
    "function": {
      "name": "ask_binary_choice",
      "arguments": {
        "prompt": "Quick! Pizza or Tacos?",
        "leftText": "Pizza 🍕",
        "rightText": "Tacos 🌮",
        "seconds": 5
      }
    }
  }]
}
```

### Step 4: Execute Tool (Server-Side)

The API route automatically executes the tool, which returns:

```json
{
  "templateType": "tpl_timed_binary",
  "prompt": "Quick! Pizza or Tacos?",
  "params": {
    "leftText": "Pizza 🍕",
    "rightText": "Tacos 🌮",
    "seconds": 5
  }
}
```

### Step 5: Render Template

```tsx
import { TemplateRenderer } from '@/components/input-templates';

<TemplateRenderer
  templateType={toolResult.templateType}
  params={{
    ...toolResult.params,
    prompt: toolResult.prompt,
    onSubmit: handlePlayerResponse
  }}
/>
```

### Step 6: Submit Player Response

```typescript
const handlePlayerResponse = async (response: any) => {
  // Store in game state
  completeTurn(currentTurnId, response);

  // Send to AI for commentary
  const followUpMessage = {
    role: 'user',
    content: `${currentPlayer.name} responded: ${JSON.stringify(response)}`
  };

  const aiCommentary = await sendChatRequest([
    ...conversationHistory,
    followUpMessage
  ]);

  // Display commentary and get next question
};
```

## Important Design Decisions

### 1. Tool Descriptions in Schemas, Not Prompt

❌ **Wrong:**
```typescript
const systemPrompt = `
You have these tools:
- ask_for_text: Use for detailed answers
- ask_for_list: Use for multiple items
...
`;
```

✅ **Correct:**
```typescript
// In template-tools.ts
{
  name: 'ask_for_text',
  description: 'Ask the current player for a detailed, paragraph-length text response...',
}

// In system prompt
"You have 6 tools at your disposal. Choose the one that best fits your question."
```

### 2. Separate Storage for Players vs Game Data

- **Player Store** (`family-glitch-players`): Persistent across games
  - Name, role, age, avatar
  - Survives "Start Over"

- **Game Store** (`family-glitch-game`): Session-specific
  - Turns, responses, scores
  - Reset on "Start Over"

### 3. Template Tools Return Config, Not HTML

Tools return JSON configuration that React components use to render:

```typescript
// Tool returns this:
{
  templateType: 'tpl_slider',
  prompt: 'How hungry are you?',
  params: { min: 0, max: 10 }
}

// React renders it:
<SliderTemplate prompt="..." min={0} max={10} onSubmit={...} />
```

### 4. Comprehensive Turn Tracking

Each turn stores EVERYTHING:

```typescript
{
  turnId: "uuid",
  playerId: "player-123",
  playerName: "John",
  templateType: "tpl_slider",
  timestamp: "2026-01-19T...",
  prompt: "How hungry are you?",
  templateParams: { min: 0, max: 10 },
  response: { value: 8 },
  score: 10,
  aiCommentary: "John's VERY hungry...",
  duration: 5.2,
  status: "completed"
}
```

This creates a perfect audit trail for analytics, replays, and AI context.

## Testing the System

### 1. Check Available Tools

```bash
curl http://localhost:3000/api/chat
```

Should return:
```json
{
  "status": "ok",
  "model": "gpt-5.2",
  "tools": [
    "ask_for_text",
    "ask_for_list",
    "ask_binary_choice",
    "ask_word_selection",
    "ask_rating",
    "ask_player_vote"
  ]
}
```

### 2. Test Single Tool Call

```typescript
import { sendChatRequest } from '@/lib/ai/client';
import { buildGameMasterPrompt } from '@/lib/ai/game-master-prompt';

const players = [
  { id: '1', name: 'John', role: 'Dad', age: 42, avatar: 1 }
];

const messages = [
  { role: 'system', content: buildGameMasterPrompt(players) },
  { role: 'user', content: 'Ask John a simple question using ask_rating.' }
];

const response = await sendChatRequest(messages);
console.log(response);
```

### 3. Test Complete Flow

See [game-integration-example.ts](../lib/ai/game-integration-example.ts) for complete examples including:
- Starting new games
- Handling responses
- Managing conversation history
- React hooks

## Common Issues & Solutions

### Issue: AI doesn't call tools

**Cause:** System prompt might be overriding tool use.

**Solution:** Keep system prompt focused on personality/context. Let tool descriptions guide usage.

### Issue: Tool returns invalid data

**Cause:** Tool executor has a bug or returns wrong format.

**Solution:** Check tool response matches template parameter interface.

### Issue: Template won't render

**Cause:** Missing required parameters or wrong templateType.

**Solution:** Validate tool response before passing to TemplateRenderer:

```typescript
import { validateTemplateParams } from '@/components/input-templates';

const validation = validateTemplateParams(
  toolResult.templateType,
  { prompt: toolResult.prompt, ...toolResult.params }
);

if (!validation.valid) {
  console.error('Invalid params:', validation.errors);
}
```

### Issue: Conversation context gets too long

**Solution:** Summarize old turns or only include last N turns in prompt:

```typescript
const recentTurns = gameState.turns.slice(-5); // Last 5 turns only
const systemPrompt = buildGameMasterPrompt(players, {
  ...gameState,
  turns: recentTurns
});
```

## Next Steps

1. **Integrate with chat page** - Connect to existing `/chat` route
2. **Add turn management** - Implement turn rotation logic
3. **Build commentary UI** - Display AI responses between turns
4. **Add scoring system** - Let AI award points, show leaderboard
5. **Create end-game flow** - Use `buildEndGamePrompt()` for finale
6. **Add analytics** - Track popular questions, response patterns

## Reference Files

- **Template Tools**: [lib/ai/template-tools.ts](../lib/ai/template-tools.ts)
- **System Prompt**: [lib/ai/game-master-prompt.ts](../lib/ai/game-master-prompt.ts)
- **Integration Examples**: [lib/ai/game-integration-example.ts](../lib/ai/game-integration-example.ts)
- **Templates**: [components/input-templates/](../components/input-templates/)
- **API Route**: [app/api/chat/route.ts](../app/api/chat/route.ts)
- **Game State**: [lib/types/game-state.ts](../lib/types/game-state.ts)

## Quick Reference

```typescript
// 1. Build prompt with game data
const systemPrompt = buildGameMasterPrompt(players, gameState);

// 2. Send message
const messages = [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: 'Start the game' }
];

const response = await sendChatRequest(messages);

// 3. AI calls template tool (automatic)
// 4. Tool returns template config (automatic)

// 5. Render template
<TemplateRenderer
  templateType={toolResult.templateType}
  params={{ ...toolResult.params, onSubmit }}
/>

// 6. Submit response back to AI
const followUp = await sendChatRequest([
  ...messages,
  { role: 'user', content: `Player responded: ${JSON.stringify(response)}` }
]);
```

---

**Status:** ✅ Ready for Integration
**Version:** 1.0.0
**Last Updated:** 2026-01-19
