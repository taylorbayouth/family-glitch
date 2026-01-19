# Quick Start: Game Master Integration

Get the AI Game Master up and running in 5 minutes.

## Prerequisites

✅ Player data setup (player-store with Zustand)
✅ Game state setup (game-store with Zustand)
✅ Input templates created (components/input-templates)
✅ OpenAI API key in `.env.local`

## Step 1: Import Dependencies

```typescript
'use client';

import { useState } from 'react';
import { usePlayerStore, useGameStore } from '@/lib/store';
import { buildGameMasterPrompt } from '@/lib/ai/game-master-prompt';
import { sendChatRequest } from '@/lib/ai/client';
import { TemplateRenderer } from '@/components/input-templates';
import type { ChatMessage } from '@/lib/ai/types';
```

## Step 2: Create Game Component

```typescript
export default function GamePage() {
  const { players } = usePlayerStore();
  const { gameId, turns, scores, addTurn, completeTurn } = useGameStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);
  const [aiCommentary, setAiCommentary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize system prompt on mount
  useState(() => {
    const systemPrompt = buildGameMasterPrompt(players, {
      gameId,
      turns,
      scores,
      status: 'playing'
    });

    setMessages([{ role: 'system', content: systemPrompt }]);
  });

  return (
    <div className="min-h-screen bg-void p-6">
      {/* Your UI here */}
    </div>
  );
}
```

## Step 3: Get First Question

```typescript
const startGame = async () => {
  setIsLoading(true);

  const newMessages = [
    ...messages,
    { role: 'user', content: 'Start the game and ask the first player a question.' }
  ];

  try {
    const response = await sendChatRequest(newMessages);

    // Response contains template configuration
    const templateConfig = JSON.parse(response.text);

    setCurrentTemplate(templateConfig);
    setMessages([...newMessages, { role: 'assistant', content: response.text }]);
  } catch (error) {
    console.error('Failed to start game:', error);
  } finally {
    setIsLoading(false);
  }
};
```

## Step 4: Render Template

```tsx
{currentTemplate && (
  <TemplateRenderer
    templateType={currentTemplate.templateType}
    params={{
      prompt: currentTemplate.prompt,
      ...currentTemplate.params,
      onSubmit: handlePlayerResponse
    }}
  />
)}
```

## Step 5: Handle Player Response

```typescript
const handlePlayerResponse = async (response: any) => {
  setIsLoading(true);

  // Store in game state
  const currentPlayer = players[0]; // Get actual current player

  addTurn({
    playerId: currentPlayer.id,
    playerName: currentPlayer.name,
    templateType: currentTemplate.templateType,
    prompt: currentTemplate.prompt,
    templateParams: currentTemplate.params,
  });

  completeTurn(currentTurnId, response);

  // Send response to AI for commentary
  const newMessages = [
    ...messages,
    {
      role: 'user',
      content: `${currentPlayer.name} responded: ${JSON.stringify(response)}. Provide your commentary and ask the next player a question.`
    }
  ];

  try {
    const aiResponse = await sendChatRequest(newMessages);

    // Parse AI response (could contain commentary + new template)
    setAiCommentary(aiResponse.text);
    setMessages([...newMessages, { role: 'assistant', content: aiResponse.text }]);

    // Get next template if AI called another tool
    if (aiResponse.toolCalls) {
      const nextTemplate = JSON.parse(aiResponse.text);
      setCurrentTemplate(nextTemplate);
    }
  } catch (error) {
    console.error('Failed to submit response:', error);
  } finally {
    setIsLoading(false);
  }
};
```

## Step 6: Display Commentary

```tsx
{aiCommentary && (
  <div className="glass rounded-xl p-6 mb-6">
    <p className="text-frost">{aiCommentary}</p>
  </div>
)}
```

## Complete Minimal Example

```typescript
'use client';

import { useState, useEffect } from 'react';
import { usePlayerStore, useGameStore } from '@/lib/store';
import { buildGameMasterPrompt } from '@/lib/ai/game-master-prompt';
import { sendChatRequest } from '@/lib/ai/client';
import { TemplateRenderer } from '@/components/input-templates';
import type { ChatMessage } from '@/lib/ai/types';

export default function GamePage() {
  const { players } = usePlayerStore();
  const { gameId, turns, scores, addTurn, completeTurn } = useGameStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);
  const [aiCommentary, setAiCommentary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  // Initialize
  useEffect(() => {
    const systemPrompt = buildGameMasterPrompt(players, {
      gameId,
      turns,
      scores,
      status: 'playing'
    });

    setMessages([{ role: 'system', content: systemPrompt }]);
  }, []);

  const startGame = async () => {
    setIsLoading(true);

    const newMessages = [
      ...messages,
      { role: 'user', content: 'Start the game and ask the first player a question.' }
    ];

    const response = await sendChatRequest(newMessages);
    const templateConfig = JSON.parse(response.text);

    setCurrentTemplate(templateConfig);
    setMessages([...newMessages, { role: 'assistant', content: response.text }]);
    setIsLoading(false);
  };

  const handlePlayerResponse = async (response: any) => {
    setIsLoading(true);

    const currentPlayer = players[currentPlayerIndex];

    // Store turn
    completeTurn('current-turn-id', response);

    // Get AI commentary
    const newMessages = [
      ...messages,
      {
        role: 'user',
        content: `${currentPlayer.name} responded: ${JSON.stringify(response)}`
      }
    ];

    const aiResponse = await sendChatRequest(newMessages);
    setAiCommentary(aiResponse.text);

    // Next player
    setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);

    // Get next question
    const nextTemplate = JSON.parse(aiResponse.text);
    setCurrentTemplate(nextTemplate);

    setMessages([...newMessages, { role: 'assistant', content: aiResponse.text }]);
    setIsLoading(false);
  };

  if (!currentTemplate) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <button
          onClick={startGame}
          disabled={isLoading}
          className="px-6 py-3 bg-glitch text-frost rounded-xl font-bold"
        >
          {isLoading ? 'Loading...' : 'Start Game'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void p-6">
      {/* Current Player */}
      <div className="text-center mb-4">
        <p className="text-glitch-bright font-mono">
          {players[currentPlayerIndex]?.name}'s Turn
        </p>
      </div>

      {/* AI Commentary */}
      {aiCommentary && (
        <div className="glass rounded-xl p-6 mb-6 max-w-2xl mx-auto">
          <p className="text-frost">{aiCommentary}</p>
        </div>
      )}

      {/* Template */}
      <TemplateRenderer
        templateType={currentTemplate.templateType}
        params={{
          prompt: currentTemplate.prompt,
          ...currentTemplate.params,
          onSubmit: handlePlayerResponse,
        }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-void/80 flex items-center justify-center">
          <p className="text-frost font-mono">AI is thinking...</p>
        </div>
      )}
    </div>
  );
}
```

## Testing

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to game page:**
   ```
   http://localhost:3000/game
   ```

3. **Click "Start Game"**

4. **Answer the AI's question**

5. **See commentary and next question**

## What's Happening Behind the Scenes

1. **System prompt** is built with player data
2. **AI receives** "Start the game" message
3. **AI calls** one of 6 template tools (e.g., `ask_binary_choice`)
4. **Tool returns** template configuration JSON
5. **React renders** the appropriate template component
6. **Player submits** their answer
7. **Response stored** in game state
8. **AI receives** player response
9. **AI generates** witty commentary
10. **AI calls** next template tool
11. **Repeat** steps 5-10

## Next Steps

- Add turn rotation logic
- Implement scoring system
- Show leaderboard
- Add end-game summary
- Style with Digital Noir theme

## Troubleshooting

**Issue:** "OpenAI client not initialized"
- Check `.env.local` has `OPENAI_API_KEY`
- Restart dev server

**Issue:** Template won't render
- Check console for validation errors
- Verify `templateType` matches registry

**Issue:** AI doesn't call tools
- Check system prompt isn't too prescriptive
- Verify tools are registered in `tools.ts`

## Full Documentation

- [Game Master Setup Guide](./GAME_MASTER_SETUP.md)
- [Input Templates System](./INPUT_TEMPLATES_SYSTEM.md)
- [AI Template Guide](./AI_TEMPLATE_GUIDE.md)
- [Integration Examples](../lib/ai/game-integration-example.ts)
