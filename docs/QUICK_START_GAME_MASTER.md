# Quick Start: Game Master Integration

This is a minimal guide for integrating the Game Master tool flow with templates.

## Prerequisites

- Player roster in `usePlayerStore`
- Game state in `useGameStore`
- OpenAI API key in `.env.local`

## Core Flow

1. Build the system prompt with `buildGameMasterPrompt()`.
2. Ask GPT-5.2 for a question using `toolChoice: 'required'`.
3. Parse `response.text` as JSON to get the template config.
4. Render `TemplateRenderer` with the config.
5. Store the response in the game store and request commentary (`toolChoice: 'none'`).

## Minimal Example

```tsx
'use client';

import { useState, useEffect } from 'react';
import { usePlayerStore, useGameStore } from '@/lib/store';
import { sendChatRequest } from '@/lib/ai/client';
import { buildGameMasterPrompt } from '@/lib/ai/game-master-prompt';
import { TemplateRenderer } from '@/components/input-templates';
import type { ChatMessage } from '@/lib/ai/types';

export default function MinimalGame() {
  const { players } = usePlayerStore();
  const { gameId, turns, scores, addTurn, completeTurn } = useGameStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [template, setTemplate] = useState<any>(null);

  useEffect(() => {
    const systemPrompt = buildGameMasterPrompt(players, {
      gameId,
      turns,
      scores,
      status: 'playing',
    });
    setMessages([{ role: 'system', content: systemPrompt }]);
  }, [players, gameId, turns, scores]);

  const loadQuestion = async () => {
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: 'Ask one short question for the current player.' },
    ];

    const response = await sendChatRequest(newMessages, { toolChoice: 'required' });
    const config = JSON.parse(response.text);

    setTemplate(config);
    setMessages([...newMessages, { role: 'assistant', content: response.text }]);
  };

  const handleSubmit = async (response: any) => {
    const turnId = addTurn({
      playerId: players[0].id,
      playerName: players[0].name,
      templateType: template.templateType,
      prompt: template.prompt,
      templateParams: template.params,
    });

    completeTurn(turnId, response);

    const followUp: ChatMessage[] = [
      ...messages,
      {
        role: 'user',
        content: `${players[0].name} responded: ${JSON.stringify(response)}. React in MAX 10 WORDS.`,
      },
    ];

    await sendChatRequest(followUp, { toolChoice: 'none' });
  };

  if (!template) {
    return <button onClick={loadQuestion}>Start</button>;
  }

  return (
    <TemplateRenderer
      templateType={template.templateType}
      params={{
        prompt: template.prompt,
        ...template.params,
        onSubmit: handleSubmit,
      }}
    />
  );
}
```

## Notes

- `tpl_player_selector` requires `players` and `currentPlayerId`. `/play` injects these at render time.
- Mini-game template types require registry handling (see `/play`).
