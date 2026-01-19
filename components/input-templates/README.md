# Input Templates

A collection of dynamic, reusable input templates for the Family Glitch game. These templates are designed to be selected and configured by the AI based on the type of interaction needed.

## Overview

Each template is a self-contained React component that handles its own state and validation. Templates are purely HTML/CSS/TypeScript with no external dependencies beyond Framer Motion for animations.

## Available Templates

### 1. Text Area (`tpl_text_area`)
**Purpose:** Deep, specific questions requiring paragraph-length answers.

**Parameters:**
- `prompt` (required): The main question
- `subtitle`: Additional instructions
- `maxLength`: Character limit (default: 500)
- `minLength`: Minimum characters required (default: 1)
- `placeholder`: Input placeholder text
- `onSubmit`: Callback function

**Response Format:**
```json
{
  "text": "user's answer here..."
}
```

### 2. Text Input (`tpl_text_input`)
**Purpose:** Rapid-fire short answers (lists, multiple items).

**Parameters:**
- `prompt` (required): The main question
- `fieldCount` (required): Number of fields (1-5)
- `fieldLabels`: Array of labels for each field
- `fieldPlaceholders`: Array of placeholders
- `maxLength`: Max length per field (default: 100)
- `requireAll`: Whether all fields must be filled (default: true)
- `onSubmit`: Callback function

**Response Format:**
```json
{
  "responses": [
    {"field": "Field 1", "value": "answer 1"},
    {"field": "Field 2", "value": "answer 2"}
  ]
}
```

### 3. Timed Binary (`tpl_timed_binary`)
**Purpose:** High-pressure "This or That" decisions with a countdown timer.

**Parameters:**
- `prompt` (required): The question
- `leftText` (required): Left option text
- `rightText` (required): Right option text
- `seconds` (required): Time limit in seconds
- `orientation`: Layout direction ("horizontal" | "vertical", default: "vertical")
- `onSubmit`: Callback function
- `onTimeout`: Optional callback when timer expires

**Response Format:**
```json
{
  "choice": "left" | "right" | null,
  "selectedText": "Pizza",
  "timeRemaining": 3.2,
  "timedOut": false
}
```

### 4. Word Grid (`tpl_word_grid`)
**Purpose:** Selecting words/attributes from a grid.

**Parameters:**
- `prompt` (required): The question
- `words` (required): Array of words to display
- `gridSize` (required): 4 (2x2), 9 (3x3), or 16 (4x4)
- `selectionMode` (required): "single" or "multiple"
- `minSelections`: Minimum required selections (default: 1)
- `maxSelections`: Maximum allowed selections
- `instructions`: Custom instruction text
- `onSubmit`: Callback function

**Response Format:**
```json
{
  "selectedWords": ["word1", "word2", "word3"],
  "selectionCount": 3
}
```

### 5. Slider (`tpl_slider`)
**Purpose:** Nuanced ratings on a continuous scale.

**Parameters:**
- `prompt` (required): The question
- `min` (required): Minimum value
- `max` (required): Maximum value
- `step`: Increment value (default: 1)
- `defaultValue`: Starting value
- `minLabel`: Label for minimum end
- `maxLabel`: Label for maximum end
- `valueEmojis`: Object mapping values to emojis/icons
- `showValue`: Display numeric value (default: true)
- `onSubmit`: Callback function

**Response Format:**
```json
{
  "value": 7,
  "min": 0,
  "max": 10,
  "label": "😊"
}
```

### 6. Player Selector (`tpl_player_selector`)
**Purpose:** Voting, accusing, or selecting other players.

**Parameters:**
- `prompt` (required): The question
- `players` (required): Array of player objects `{id, name, avatar}`
- `currentPlayerId` (required): ID of current player (excluded from selection)
- `allowMultiple`: Allow selecting multiple players (default: false)
- `maxSelections`: Max selections if allowMultiple (default: 1)
- `instructions`: Custom instruction text
- `onSubmit`: Callback function

**Response Format:**
```json
{
  "selectedPlayerIds": ["player-123"],
  "selectedPlayers": [
    {"id": "player-123", "name": "John"}
  ]
}
```

## Usage

### Basic Usage

```tsx
import { TemplateRenderer } from '@/components/input-templates';

function GameTurn() {
  const handleSubmit = (response: any) => {
    console.log('User response:', response);
    // Store in game state
  };

  return (
    <TemplateRenderer
      templateType="tpl_text_area"
      params={{
        prompt: "What's your biggest fear?",
        subtitle: "Be honest... we won't judge (much)",
        maxLength: 200,
        onSubmit: handleSubmit,
      }}
    />
  );
}
```

### Dynamic Template Selection (AI-Driven)

```tsx
import { TemplateRenderer } from '@/components/input-templates';
import type { TemplateType, TemplateParams } from '@/components/input-templates';

function AIDrivenTurn({ turnData }: { turnData: Turn }) {
  const handleSubmit = (response: any) => {
    // Store response in game state
    storeTurnResponse(turnData.turnId, response);
  };

  // AI has already determined the template type and params
  return (
    <TemplateRenderer
      templateType={turnData.templateType as TemplateType}
      params={{
        ...turnData.templateParams,
        onSubmit: handleSubmit,
      }}
    />
  );
}
```

### Validation

```tsx
import { validateTemplateParams } from '@/components/input-templates';

// Validate AI-provided parameters before rendering
const validation = validateTemplateParams(templateType, params);
if (!validation.valid) {
  console.error('Invalid template params:', validation.errors);
}
```

## Design System

All templates follow the **Digital Noir** design system:

- **Colors:** `frost`, `glitch`, `glitch-bright`, `alert`, `steel-*`, `void`
- **Fonts:** Sans-serif for content, monospace for meta/technical info
- **Animations:** Framer Motion for smooth transitions
- **Styling:** Tailwind CSS with custom theme tokens

## Adding New Templates

1. Create component in `components/input-templates/YourTemplate.tsx`
2. Define parameter interface in `lib/types/template-params.ts`
3. Add to registry in `components/input-templates/index.tsx`
4. Update this README with documentation

## Integration with Game State

Templates are designed to work seamlessly with the game state structure defined in `lib/types/game-state.ts`. Each turn stores:

```typescript
{
  turnId: string;
  templateType: 'tpl_text_area' | 'tpl_text_input' | ...,
  templateParams: { /* original params sent by AI */ },
  response: { /* user's response from onSubmit */ }
}
```

This ensures a complete audit trail of every interaction during the game.
