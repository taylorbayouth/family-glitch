# Input Templates

A collection of reusable input templates for Family Glitch. The AI selects a template tool, the server returns a template config, and the client renders the matching component.

## Overview

- Each template is a self-contained React component with its own validation.
- Templates use Tailwind + Framer Motion.
- Responses are structured objects stored in the game turn.

## Available Templates

### 1. Text Area (`tpl_text_area`)

Purpose: Paragraph-length answers.

Parameters:
- `prompt` (required)
- `subtitle`
- `maxLength` (default 500)
- `minLength` (default 1)
- `placeholder` (default "Type your answer...")
- `onSubmit`

Response:
```json
{ "text": "user response" }
```

Notes:
- Submit button is always visible but disabled until valid.
- Cmd/Ctrl + Enter submits.

### 2. Text Input (`tpl_text_input`)

Purpose: Multiple short items.

Parameters:
- `prompt` (required)
- `fieldCount` (required, 1 to 5)
- `fieldLabels`
- `fieldPlaceholders`
- `maxLength` (default 100)
- `requireAll` (default true)
- `onSubmit`

Response:
```json
{
  "responses": [
    { "field": "Field 1", "value": "Answer" }
  ]
}
```

### 3. Timed Binary (`tpl_timed_binary`)

Purpose: High-pressure binary choices.

Parameters:
- `prompt` (required)
- `leftText` (required)
- `rightText` (required)
- `seconds` (required)
- `orientation` (default "vertical")
- `onSubmit`
- `onTimeout` (optional)

Response (chosen):
```json
{
  "choice": "left",
  "selectedText": "Pizza",
  "timeRemaining": 2.1,
  "timedOut": false
}
```

Response (timeout):
```json
{ "choice": null, "timedOut": true }
```

### 4. Word Grid (`tpl_word_grid`)

Purpose: Select words from a grid.

Parameters:
- `prompt` (required)
- `words` (required)
- `gridSize` (required: 4, 9, 16, or 25)
- `selectionMode` (required: "single" or "multiple")
- `minSelections` (default 1)
- `maxSelections`
- `instructions`
- `onSubmit`

Response:
```json
{ "selectedWords": ["word1"], "selectionCount": 1 }
```

### 5. Slider (`tpl_slider`)

Purpose: Numeric ratings.

Parameters:
- `prompt` (required)
- `min` (required)
- `max` (required)
- `step` (default 1)
- `defaultValue`
- `minLabel`, `maxLabel`
- `valueEmojis` (optional)
- `showValue` (default true)
- `onSubmit`

Response:
```json
{ "value": 7, "min": 0, "max": 10, "label": "7" }
```

If `valueEmojis` contains a key for the value, `label` is the emoji.

### 6. Player Selector (`tpl_player_selector`)

Purpose: Vote for or target players.

Parameters:
- `prompt` (required)
- `players` (required)
- `currentPlayerId` (required, excluded from selection)
- `allowMultiple` (default false)
- `maxSelections` (default 1)
- `instructions`
- `onSubmit`

Response:
```json
{
  "selectedPlayerIds": ["player-id"],
  "selectedPlayers": [{ "id": "player-id", "name": "Taylor" }]
}
```

## Template Renderer

Use `TemplateRenderer` from `components/input-templates/index.tsx`:

```tsx
<TemplateRenderer
  templateType="tpl_text_area"
  params={{
    prompt: "Tell a story",
    onSubmit: handleSubmit,
  }}
/>
```

## Validation Helper

`validateTemplateParams()` exists in `components/input-templates/index.tsx` but is not wired into `/play` yet.
