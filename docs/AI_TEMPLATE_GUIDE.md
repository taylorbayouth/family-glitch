# AI Template Selection Guide

This guide describes how the Game Master model should select input templates via tool calls.

## Core Rule

The model does not return raw template JSON directly. It calls a tool (function), and the server returns a template config.

## Tool to Template Mapping

- `ask_for_text` -> `tpl_text_area`
- `ask_for_list` -> `tpl_text_input`
- `ask_binary_choice` -> `tpl_timed_binary`
- `ask_word_selection` -> `tpl_word_grid`
- `ask_rating` -> `tpl_slider`
- `ask_player_vote` -> `tpl_player_selector`

## Mini-Game Triggers

When the system prompt indicates Act 2 or Act 3, use a mini-game trigger tool instead of an input template:

- `trigger_trivia_challenge`
- `trigger_personality_match`
- `trigger_madlibs_challenge`
- `trigger_cryptic_connection`
- `trigger_hard_trivia`

## Template Guidance

### Text Area (ask_for_text)
Use for detailed, paragraph-length answers.

### Text Input (ask_for_list)
Use for multiple short items (1-5 fields).

### Timed Binary (ask_binary_choice)
Use for quick "this or that" choices with a countdown.

### Word Grid (ask_word_selection)
Use for selecting words or attributes.
- `gridSize` must be 4, 9, 16, or 25.

### Slider (ask_rating)
Use for numeric ratings and comparisons.

### Player Selector (ask_player_vote)
Use for voting or targeting another player.
- The UI injects the `players` list and `currentPlayerId` when rendering.

## Response Shapes (Collected by the UI)

These are the response objects produced by the templates:

- Text area: `{ "text": "..." }`
- Text input: `{ "responses": [{ "field": "Field 1", "value": "..." }] }`
- Timed binary: `{ "choice": "left" | "right" | null, "timedOut": boolean, ... }`
- Word grid: `{ "selectedWords": [...], "selectionCount": number }`
- Slider: `{ "value": number, "min": number, "max": number, "label": string }`
- Player selector: `{ "selectedPlayerIds": [...], "selectedPlayers": [...] }`

## Prompt Hygiene

The system prompt enforces these rules:
- Ask one short question only.
- Do not include player names in the question text.
- Vary tool usage.
- Keep commentary short (max 10 words).

## Where This Is Used

- `/play` builds the system prompt with `buildGameMasterPrompt()`
- The AI calls template tools in Act 1
- The AI calls mini-game triggers in Act 2+ per prompt rules
