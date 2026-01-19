# Template Quick Reference Card

Quick lookup for AI template selection during gameplay.

## Template Selector

```
Question starts with...          Use this template
─────────────────────────────────────────────────────────────
"Describe..."                    tpl_text_area
"Explain..."                     tpl_text_area
"Tell me about..."               tpl_text_area
"What's your..."                 tpl_text_area

"Name 3..."                      tpl_text_input
"List 5..."                      tpl_text_input
"What are 2..."                  tpl_text_input

"X or Y?"                        tpl_timed_binary
"This or That?"                  tpl_timed_binary
"Would you rather..."            tpl_timed_binary

"Select words that..."           tpl_word_grid
"Choose emotions..."             tpl_word_grid
"Pick attributes..."             tpl_word_grid

"Rate from 0 to 10..."           tpl_slider
"How much..."                    tpl_slider
"On a scale of..."               tpl_slider

"Who is..."                      tpl_player_selector
"Who's most likely..."           tpl_player_selector
"Vote for..."                    tpl_player_selector
```

## JSON Templates

### Text Area
```json
{
  "templateType": "tpl_text_area",
  "prompt": "Your question here",
  "subtitle": "Optional context",
  "params": { "maxLength": 300 }
}
```

### Text Input
```json
{
  "templateType": "tpl_text_input",
  "prompt": "Your question here",
  "params": {
    "fieldCount": 3,
    "requireAll": true
  }
}
```

### Timed Binary
```json
{
  "templateType": "tpl_timed_binary",
  "prompt": "Your question here",
  "params": {
    "leftText": "Option A",
    "rightText": "Option B",
    "seconds": 5
  }
}
```

### Word Grid
```json
{
  "templateType": "tpl_word_grid",
  "prompt": "Your question here",
  "params": {
    "words": ["Word1", "Word2", "Word3", "Word4"],
    "gridSize": 4,
    "selectionMode": "multiple",
    "maxSelections": 2
  }
}
```

### Slider
```json
{
  "templateType": "tpl_slider",
  "prompt": "Your question here",
  "params": {
    "min": 0,
    "max": 10,
    "minLabel": "Not at all",
    "maxLabel": "Extremely"
  }
}
```

### Player Selector
```json
{
  "templateType": "tpl_player_selector",
  "prompt": "Your question here",
  "params": {
    "allowMultiple": false
  }
}
```

## Timer Guidelines

```
Difficulty    Timer (seconds)   Example
───────────────────────────────────────────────────
Casual        10-15            Easy food choices
Spicy         5-8              Personal preferences
Savage        3-5              Impossible choices
```

## Response Formats

```typescript
// tpl_text_area
{ text: "user's answer" }

// tpl_text_input
{ responses: [{ field: "Item 1", value: "answer" }] }

// tpl_timed_binary
{ choice: "left", selectedText: "Pizza", timedOut: false }

// tpl_word_grid
{ selectedWords: ["Happy", "Excited"], selectionCount: 2 }

// tpl_slider
{ value: 7, min: 0, max: 10 }

// tpl_player_selector
{ selectedPlayerIds: ["id"], selectedPlayers: [{id, name}] }
```

## Grid Sizes

```
4  = 2x2 grid (4 words)
9  = 3x3 grid (9 words)
16 = 4x4 grid (16 words)
```

## Selection Modes

```
"single"   = Choose exactly 1
"multiple" = Choose 1 or more (use min/maxSelections)
```

## Common Mistakes

❌ Wrong:
```json
{ "templateType": "text_area" }  // Missing tpl_ prefix
```

✅ Correct:
```json
{ "templateType": "tpl_text_area" }
```

---

❌ Wrong:
```json
{ "gridSize": 5 }  // Invalid grid size
```

✅ Correct:
```json
{ "gridSize": 4 }  // Must be 4, 9, or 16
```

---

❌ Wrong:
```json
{ "seconds": 0 }  // Timer must be positive
```

✅ Correct:
```json
{ "seconds": 5 }
```

## Pro Tips

1. **Vary your templates** - Don't use the same one twice in a row
2. **Match intensity** - Use timed binary for high-energy moments
3. **Read responses** - Reference previous answers in new questions
4. **Add emojis** - Makes prompts more engaging
5. **Use subtitles** - Clarify or add humor

## Examples by Game Phase

### Opening (Light & Fun)
```json
{
  "templateType": "tpl_slider",
  "prompt": "How excited are you right now?",
  "params": { "min": 0, "max": 10 }
}
```

### Mid-Game (Getting Spicy)
```json
{
  "templateType": "tpl_player_selector",
  "prompt": "Who's most likely to lie about their age?"
}
```

### End-Game (Savage)
```json
{
  "templateType": "tpl_timed_binary",
  "prompt": "Save Mom or Save Dad?",
  "params": {
    "leftText": "Mom",
    "rightText": "Dad",
    "seconds": 3
  }
}
```
