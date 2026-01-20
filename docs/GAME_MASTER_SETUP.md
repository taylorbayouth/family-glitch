# Game Master Setup Guide

This guide explains how the AI Game Master integrates with the input template tools.

## Architecture

```
UI (Play Page)
  -> /api/chat (tool loop)
    -> OpenAI GPT-5.2
      -> Tool Registry
        -> Template config
```

## Key Components

### Template Tools

Defined in `lib/ai/template-tools.ts` and registered via `ToolRegistry`:

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

### Game Master Prompt

`buildGameMasterPrompt()` injects:
- Players (names, roles, ages)
- Recent turns
- Current scores
- Act rules (Act 1 = templates, Act 2+ = mini-games)

### Template Renderer

`TemplateRenderer` maps template types to components in `components/input-templates/`.

## End-to-End Flow

1. Build system prompt:

```ts
const systemPrompt = buildGameMasterPrompt(players, { gameId, turns, scores });
```

2. Ask for a question:

```ts
const response = await sendChatRequest([
  { role: 'system', content: systemPrompt },
  { role: 'user', content: 'Ask one short question.' },
], { toolChoice: 'required' });
```

3. Parse template config:

```ts
const templateConfig = JSON.parse(response.text);
```

4. Render template:

```tsx
<TemplateRenderer
  templateType={templateConfig.templateType}
  params={{
    prompt: templateConfig.prompt,
    ...templateConfig.params,
    onSubmit: handleResponse,
  }}
/>
```

5. Send response for commentary:

```ts
await sendChatRequest([
  ...messages,
  { role: 'user', content: `${player.name} responded: ${JSON.stringify(response)}` },
], { toolChoice: 'none' });
```

## Notes

- Template tool results are returned immediately as JSON in `response.text`.
- Tool descriptions live in the tool schemas, not in the system prompt.
- `/api/chat` uses Chat Completions (not the Responses API).

## Testing

Check available tools:

```bash
curl http://localhost:3000/api/chat
```

## References

- `app/api/chat/route.ts`
- `lib/ai/template-tools.ts`
- `lib/ai/game-master-prompt.ts`
- `components/input-templates/`
