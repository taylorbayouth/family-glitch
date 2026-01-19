# AI Template Selection Guide

This guide is for the AI system (GPT) to understand how to select and configure input templates during gameplay.

## Overview

During gameplay, the AI will need to collect information from players. Instead of plain text responses, the AI should select appropriate **input templates** that match the type of interaction needed.

## When to Use Templates

Every time you need player input, you should:
1. Determine the type of response you want
2. Select the most appropriate template
3. Configure the template parameters
4. The system will render the template and collect the response

## Template Selection Decision Tree

```
Need player input?
│
├─ Long-form answer? → tpl_text_area
│
├─ Multiple short items (list)? → tpl_text_input
│
├─ Quick binary choice? → tpl_timed_binary
│
├─ Select from multiple options? → tpl_word_grid
│
├─ Rating/scale? → tpl_slider
│
└─ Select another player? → tpl_player_selector
```

## Template Reference

### 1. Text Area (`tpl_text_area`)

**Use when:** You need a detailed, paragraph-length answer.

**Examples:**
- "Describe your most embarrassing moment"
- "What's Dad's 'tell' when he's lying?"
- "Explain why you think Mom is the best cook"

**JSON Format:**
```json
{
  "templateType": "tpl_text_area",
  "prompt": "What's your biggest secret nobody in this room knows?",
  "subtitle": "Don't worry, we won't judge... much",
  "params": {
    "maxLength": 300,
    "minLength": 20,
    "placeholder": "Type your answer here..."
  }
}
```

**Response Format:**
```json
{
  "text": "Well, I once accidentally..."
}
```

---

### 2. Text Input (`tpl_text_input`)

**Use when:** You need multiple short answers (lists).

**Examples:**
- "Name 3 things in your pockets"
- "List 5 words that describe Dad"
- "What are 2 places Mom has never been?"

**JSON Format:**
```json
{
  "templateType": "tpl_text_input",
  "prompt": "Name 3 things in your backpack right now",
  "params": {
    "fieldCount": 3,
    "fieldLabels": ["Item 1", "Item 2", "Item 3"],
    "requireAll": true,
    "maxLength": 50
  }
}
```

**Response Format:**
```json
{
  "responses": [
    {"field": "Item 1", "value": "Laptop"},
    {"field": "Item 2", "value": "Water bottle"},
    {"field": "Item 3", "value": "Snacks"}
  ]
}
```

---

### 3. Timed Binary (`tpl_timed_binary`)

**Use when:** You want a quick, high-pressure "This or That" decision.

**Examples:**
- "Pizza or Tacos?"
- "Beach vacation or Mountain cabin?"
- "Save Mom or Save Dad?" (spicy!)

**JSON Format:**
```json
{
  "templateType": "tpl_timed_binary",
  "prompt": "Quick! Choose one!",
  "subtitle": "You only have 5 seconds...",
  "params": {
    "leftText": "Pizza 🍕",
    "rightText": "Tacos 🌮",
    "seconds": 5,
    "orientation": "vertical"
  }
}
```

**Response Format:**
```json
{
  "choice": "left",
  "selectedText": "Pizza 🍕",
  "timeRemaining": 2.3,
  "timedOut": false
}
```

---

### 4. Word Grid (`tpl_word_grid`)

**Use when:** Player needs to select words/attributes from options.

**Examples:**
- "Select 3 words that describe Mom"
- "Which of these foods do you hate?"
- "Pick emotions you're feeling right now"

**JSON Format:**
```json
{
  "templateType": "tpl_word_grid",
  "prompt": "Select 3 words that best describe Dad",
  "params": {
    "words": ["Funny", "Grumpy", "Patient", "Loud", "Smart", "Stubborn", "Kind", "Sarcastic", "Cool"],
    "gridSize": 9,
    "selectionMode": "multiple",
    "minSelections": 3,
    "maxSelections": 3,
    "instructions": "Choose exactly 3"
  }
}
```

**Response Format:**
```json
{
  "selectedWords": ["Funny", "Sarcastic", "Cool"],
  "selectionCount": 3
}
```

---

### 5. Slider (`tpl_slider`)

**Use when:** You need a nuanced rating on a scale.

**Examples:**
- "How hungry is Mom right now? (0-10)"
- "Rate Dad's driving skills (1-5)"
- "How awkward is this moment? (0-100)"

**JSON Format:**
```json
{
  "templateType": "tpl_slider",
  "prompt": "How hungry is Mom RIGHT NOW?",
  "params": {
    "min": 0,
    "max": 10,
    "step": 1,
    "defaultValue": 5,
    "minLabel": "Not hungry",
    "maxLabel": "STARVING",
    "showValue": true,
    "valueEmojis": {
      "0": "😌",
      "5": "🤔",
      "10": "😫"
    }
  }
}
```

**Response Format:**
```json
{
  "value": 8,
  "min": 0,
  "max": 10,
  "label": "😫"
}
```

---

### 6. Player Selector (`tpl_player_selector`)

**Use when:** Player needs to vote for/select another player.

**Examples:**
- "Who's most likely to survive a zombie apocalypse?"
- "Who's the worst driver in this family?"
- "Who would you trust with a secret?"

**JSON Format:**
```json
{
  "templateType": "tpl_player_selector",
  "prompt": "Who is most likely to forget someone's birthday?",
  "params": {
    "allowMultiple": false,
    "maxSelections": 1,
    "instructions": "Choose one person"
  }
}
```

**Note:** The system automatically provides the `players` array and `currentPlayerId` based on game state.

**Response Format:**
```json
{
  "selectedPlayerIds": ["player-uuid-123"],
  "selectedPlayers": [
    {"id": "player-uuid-123", "name": "John"}
  ]
}
```

---

## Template Selection Tips

### Match Question Type to Template

| Question Type | Best Template |
|--------------|---------------|
| "Describe..." | `tpl_text_area` |
| "Name 3..." | `tpl_text_input` |
| "X or Y?" | `tpl_timed_binary` |
| "Select words that..." | `tpl_word_grid` |
| "Rate from 0 to 10..." | `tpl_slider` |
| "Who..." | `tpl_player_selector` |

### Creating Engaging Prompts

1. **Be specific**: "What's your most embarrassing high school moment?" is better than "Tell me something embarrassing"

2. **Add context**: Use the `subtitle` field to clarify or add humor
   ```json
   {
     "prompt": "Who's the best cook?",
     "subtitle": "And no, ordering takeout doesn't count"
   }
   ```

3. **Use emojis**: Make prompts visually engaging
   ```json
   {
     "leftText": "Coffee ☕",
     "rightText": "Tea 🍵"
   }
   ```

4. **Set appropriate time limits**:
   - Easy choices: 10-15 seconds
   - Harder choices: 5-8 seconds
   - Impossible choices: 3-5 seconds

### Difficulty Progression

**Casual Mode:**
- Use longer timers (10+ seconds)
- Avoid targeting/voting mechanics
- Keep questions light and fun

**Spicy Mode:**
- Shorter timers (5-8 seconds)
- More personal questions
- Include player targeting

**Savage Mode:**
- Very short timers (3-5 seconds)
- Deeply personal questions
- Frequent player voting/targeting
- Controversial "Would you rather" scenarios

---

## Integration Flow

### Step 1: AI Determines Question
```typescript
// AI thinks: "I want to know who's the worst driver"
const questionType = "targeting"; // This requires player selection
```

### Step 2: AI Selects Template
```typescript
const templateType = "tpl_player_selector";
```

### Step 3: AI Configures Parameters
```json
{
  "templateType": "tpl_player_selector",
  "prompt": "Who's the WORST driver in this family?",
  "subtitle": "Be honest... we all know who it is 👀",
  "params": {
    "allowMultiple": false,
    "instructions": "Choose one brave soul"
  }
}
```

### Step 4: System Renders Template
The game system will:
1. Render the appropriate template component
2. Display it to the current player
3. Collect their response
4. Store it in game state

### Step 5: AI Receives Response
```json
{
  "selectedPlayers": [{"id": "dad-123", "name": "Dad"}]
}
```

### Step 6: AI Provides Commentary
```
"Interesting... 3 out of 4 people voted for Dad as the worst driver.
Dad, maybe it's time to renew that license? 😬"
```

---

## Advanced Usage

### Conditional Templates

Based on previous answers, adjust your template choice:

```typescript
// If player said they're hungry (from slider response)
if (previousResponse.value > 7) {
  // Follow up with binary choice
  return {
    templateType: "tpl_timed_binary",
    prompt: "Quick! What are you craving?",
    params: {
      leftText: "Sweet 🍩",
      rightText: "Savory 🍕",
      seconds: 5
    }
  };
}
```

### Chaining Templates

Create mini-games by chaining templates:

1. **Round 1:** Word Grid - "Select 3 words that describe your mood"
2. **Round 2:** Slider - "On a scale of 1-10, how much do you trust your gut?"
3. **Round 3:** Player Selector - "Who in this room shares your vibe right now?"

### Dynamic Word Grids

Generate word options based on context:

```typescript
// For "Describe this meal" question
const foodWords = ["Delicious", "Bland", "Spicy", "Cold", "Perfect", "Overcooked", "Undercooked", "Salty", "Sweet"];

return {
  templateType: "tpl_word_grid",
  prompt: "How would you describe this meal?",
  params: {
    words: foodWords,
    gridSize: 9,
    selectionMode: "multiple",
    maxSelections: 4
  }
};
```

---

## Best Practices

1. **Vary Templates**: Don't use the same template repeatedly
2. **Match Intensity**: Use timed binary for high-energy moments
3. **Read the Room**: Adjust based on player responses
4. **Store Everything**: All responses are stored with full context
5. **Use Data**: Reference previous turns when generating new questions

---

## Error Handling

If a template fails to validate:
```json
{
  "valid": false,
  "errors": ["Missing required field: prompt", "fieldCount must be between 1 and 5"]
}
```

Always ensure required fields are included and constraints are met.

---

## Testing Templates

Use the demo mode to test all templates:
```typescript
import { AllTemplatesDemo } from '@/components/input-templates/USAGE_EXAMPLE';
```

This cycles through all templates with sample data for validation.
