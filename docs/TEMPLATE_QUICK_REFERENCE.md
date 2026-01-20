# Template Quick Reference

Quick lookup for template tools and configs.

## Tool Selection

```
Question type                        Tool
-------------------------------------------
Long explanation                      ask_for_text
Short list / multiple items           ask_for_list
Binary choice / timed decision        ask_binary_choice
Pick words from options               ask_word_selection
Rating on a scale                     ask_rating
Vote for another player               ask_player_vote
```

## Template Config Examples

### Text Area
```json
{
  "templateType": "tpl_text_area",
  "prompt": "Describe your most embarrassing moment",
  "params": { "maxLength": 300 }
}
```

### Text Input
```json
{
  "templateType": "tpl_text_input",
  "prompt": "Name 3 things in your pocket",
  "params": { "fieldCount": 3, "requireAll": true }
}
```

### Timed Binary
```json
{
  "templateType": "tpl_timed_binary",
  "prompt": "Pizza or tacos?",
  "params": { "leftText": "Pizza", "rightText": "Tacos", "seconds": 5 }
}
```

### Word Grid
```json
{
  "templateType": "tpl_word_grid",
  "prompt": "Select 3 words that describe Mom",
  "params": {
    "words": ["Funny", "Strict", "Calm", "Loud"],
    "gridSize": 4,
    "selectionMode": "multiple",
    "maxSelections": 3
  }
}
```

### Slider
```json
{
  "templateType": "tpl_slider",
  "prompt": "How hungry are you?",
  "params": { "min": 0, "max": 10 }
}
```

### Player Selector
```json
{
  "templateType": "tpl_player_selector",
  "prompt": "Who is the worst driver?",
  "params": { "allowMultiple": false }
}
```

## Response Shapes

- Text area: `{ "text": "..." }`
- Text input: `{ "responses": [{ "field": "Field 1", "value": "..." }] }`
- Timed binary: `{ "choice": "left" | "right" | null, "timedOut": boolean, ... }`
- Word grid: `{ "selectedWords": [...], "selectionCount": number }`
- Slider: `{ "value": number, "min": number, "max": number, "label": string }`
- Player selector: `{ "selectedPlayerIds": [...], "selectedPlayers": [...] }`

## Word Grid Sizes

- 4 (2x2)
- 9 (3x3)
- 16 (4x4)
- 25 (5x5)

## Timed Binary Guidance

- 10 to 15 seconds for casual prompts
- 5 to 8 seconds for spicy prompts
- 3 to 5 seconds for high-pressure prompts
