# Input Templates System

This document describes the template system used to collect structured player input during gameplay.

## High-Level Flow

1. Game Master calls a template tool (e.g., `ask_for_list`).
2. `/api/chat` executes the tool and returns a template config as JSON.
3. `/play` parses the config and renders `TemplateRenderer`.
4. The template component collects input and calls `onSubmit()`.
5. `/play` stores the response in the turn record.

## File Structure

```
components/input-templates/
  TextAreaTemplate.tsx
  TextInputTemplate.tsx
  TimedBinaryTemplate.tsx
  WordGridTemplate.tsx
  SliderTemplate.tsx
  PlayerSelectorTemplate.tsx
  index.tsx
  README.md

lib/types/template-params.ts
```

## Template Types

- `tpl_text_area`
- `tpl_text_input`
- `tpl_timed_binary`
- `tpl_word_grid` (gridSize: 4, 9, 16, or 25)
- `tpl_slider`
- `tpl_player_selector`

## Turn Data Shape

Turns are stored in `lib/types/game-state.ts`:

```ts
export interface Turn {
  turnId: string;
  playerId: string;
  playerName: string;
  templateType: string;
  timestamp: string; // ISO string
  prompt: string;
  templateParams: Record<string, any>;
  response: Record<string, any> | null;
  score?: number;
  aiCommentary?: string;
  duration?: number;
  status: 'pending' | 'completed' | 'skipped' | 'timeout';
}
```

## Template Registry

`TemplateRenderer` maps template types to components:

```ts
const TEMPLATE_REGISTRY = {
  tpl_text_area: TextAreaTemplate,
  tpl_text_input: TextInputTemplate,
  tpl_timed_binary: TimedBinaryTemplate,
  tpl_word_grid: WordGridTemplate,
  tpl_slider: SliderTemplate,
  tpl_player_selector: PlayerSelectorTemplate,
};
```

## Usage Example

```tsx
<TemplateRenderer
  templateType="tpl_text_input"
  params={{
    prompt: 'Name 3 foods you refuse to eat',
    fieldCount: 3,
    onSubmit: handleResponse,
  }}
/>
```

## Player Selector Injection

`tpl_player_selector` requires `players` and `currentPlayerId`. `/play` injects those values when it renders the template.

## Validation Helper

`validateTemplateParams()` exists in `components/input-templates/index.tsx` and can be used to validate AI responses. It is not currently called in `/play`.

## Styling

Templates use Tailwind utilities and Framer Motion. Theme tokens come from `app/globals.css`.
