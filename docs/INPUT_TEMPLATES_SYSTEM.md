# Input Templates System - Complete Documentation

## Overview

The Input Templates System is a flexible, type-safe framework for collecting user input during gameplay. It provides 6 specialized templates that the AI can dynamically select and configure based on the type of interaction needed.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AI Decision Layer                       │
│  (Selects template type & configures parameters)            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Template Registry                          │
│  (Maps template types to React components)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Template Renderer                            │
│  (Dynamically renders the selected template)                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Individual Template Component                   │
│  (Pure HTML/CSS/TypeScript + Framer Motion)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Game State Store                          │
│  (Stores turn data, responses, scores)                      │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
family-glitch/
│
├── components/
│   └── input-templates/
│       ├── TextAreaTemplate.tsx          # Deep text input
│       ├── TextInputTemplate.tsx         # Multiple short inputs
│       ├── TimedBinaryTemplate.tsx       # Timed binary choice
│       ├── WordGridTemplate.tsx          # Grid selection
│       ├── SliderTemplate.tsx            # Rating scale
│       ├── PlayerSelectorTemplate.tsx    # Player voting
│       ├── index.tsx                     # Registry & exports
│       ├── README.md                     # Template docs
│       └── USAGE_EXAMPLE.tsx             # Integration examples
│
├── lib/
│   ├── types/
│   │   ├── game-state.ts                # Game state structure
│   │   └── template-params.ts           # Template parameters
│   │
│   └── store/
│       ├── game-store.ts                # Enhanced with turn tracking
│       ├── player-store.ts              # Persistent player data
│       └── index.ts                     # Store exports
│
└── docs/
    ├── AI_TEMPLATE_GUIDE.md            # Guide for AI integration
    └── INPUT_TEMPLATES_SYSTEM.md       # This file
```

## Core Concepts

### 1. Game State Structure

The game state tracks comprehensive data for each turn:

```typescript
interface Turn {
  turnId: string;              // Unique identifier
  playerId: string;            // Who's taking this turn
  playerName: string;          // Cached player name
  templateType: string;        // Which template was used
  timestamp: Date;             // When turn started
  prompt: string;              // The AI's question
  templateParams: object;      // Template configuration
  response: object | null;     // User's response
  score?: number;              // Points awarded
  aiCommentary?: string;       // AI's response
  duration?: number;           // Time taken (seconds)
  status: 'pending' | 'completed' | 'skipped' | 'timeout';
}
```

### 2. Template Parameter Types

Each template has strongly-typed parameters:

```typescript
// Example: TimedBinaryParams
interface TimedBinaryParams extends BaseTemplateParams {
  leftText: string;        // Required
  rightText: string;       // Required
  seconds: number;         // Required
  orientation?: 'horizontal' | 'vertical';  // Optional
}
```

### 3. Template Registry

A central registry maps template types to components:

```typescript
const TEMPLATE_REGISTRY = {
  tpl_text_area: TextAreaTemplate,
  tpl_text_input: TextInputTemplate,
  tpl_timed_binary: TimedBinaryTemplate,
  tpl_word_grid: WordGridTemplate,
  tpl_slider: SliderTemplate,
  tpl_player_selector: PlayerSelectorTemplate,
};
```

### 4. Dynamic Rendering

The `TemplateRenderer` component handles dynamic template selection:

```tsx
<TemplateRenderer
  templateType="tpl_slider"
  params={{
    prompt: "How hungry are you?",
    min: 0,
    max: 10,
    onSubmit: handleResponse
  }}
/>
```

## Available Templates

| Template | Purpose | Use When |
|----------|---------|----------|
| `tpl_text_area` | Long-form text | Need detailed, paragraph-length answers |
| `tpl_text_input` | Multiple short answers | Need lists or multiple items |
| `tpl_timed_binary` | Binary choice with timer | High-pressure "This or That" decisions |
| `tpl_word_grid` | Word selection | Selecting attributes/emotions/options |
| `tpl_slider` | Numeric rating | Nuanced ratings on a scale |
| `tpl_player_selector` | Player voting | Voting, targeting, or selecting players |

## Integration Flow

### For Developers

1. **Setup Turn**
   ```typescript
   const { addTurn } = useGameStore();

   addTurn({
     playerId: currentPlayer.id,
     playerName: currentPlayer.name,
     templateType: 'tpl_text_area',
     prompt: "What's your biggest secret?",
     templateParams: { maxLength: 300 }
   });
   ```

2. **Render Template**
   ```tsx
   <TemplateRenderer
     templateType={turn.templateType}
     params={{
       ...turn.templateParams,
       onSubmit: handleSubmit
     }}
   />
   ```

3. **Handle Response**
   ```typescript
   const handleSubmit = (response: any) => {
     completeTurn(turn.turnId, response, duration);
     updatePlayerScore(player.id, 10);
   };
   ```

### For AI System

1. **Determine Question Type**
   - Analyze what information you need
   - Consider the game context and difficulty

2. **Select Template**
   - Match question type to template (see decision tree in AI_TEMPLATE_GUIDE.md)

3. **Configure Parameters**
   ```json
   {
     "templateType": "tpl_word_grid",
     "prompt": "Select 3 words that describe Dad",
     "params": {
       "words": ["Funny", "Grumpy", "Patient", ...],
       "gridSize": 9,
       "selectionMode": "multiple",
       "maxSelections": 3
     }
   }
   ```

4. **Receive Response**
   - System handles rendering and validation
   - Response is stored in game state
   - AI receives structured response data

5. **Generate Commentary**
   - Analyze response in context
   - Reference previous turns
   - Provide witty/snarky commentary

## Data Storage

### Player Data (Persistent)
Stored in `player-store` with localStorage key: `family-glitch-players`
- Survives "Start Over"
- Contains: name, role, age, avatar

```typescript
{
  players: [
    { id: "uuid", name: "John", role: "Dad", age: 42, avatar: 5 }
  ]
}
```

### Game Data (Session)
Stored in `game-store` with localStorage key: `family-glitch-game`
- Reset on "Start Over"
- Contains: turns, scores, game state

```typescript
{
  gameId: "uuid",
  turns: [...],
  scores: { "player-id": 50 },
  status: "playing"
}
```

## Validation

All templates include built-in validation:

```typescript
import { validateTemplateParams } from '@/components/input-templates';

const validation = validateTemplateParams(templateType, params);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

## Styling

All templates follow the **Digital Noir** design system:

- **Primary Colors:**
  - `frost` - Main text
  - `glitch` - Primary accent
  - `glitch-bright` - Highlights
  - `alert` - Warnings/urgent

- **Neutral Colors:**
  - `void` - Dark background
  - `void-light` - Slightly lighter background
  - `steel-*` - Gray scale (500, 600, 700, 800, 900)

- **Fonts:**
  - Sans-serif for prompts and content
  - Monospace for meta-info (timers, counts, hints)

- **Animations:**
  - Framer Motion for smooth transitions
  - Scale animations on interactions
  - Fade in/out for modals

## Best Practices

### For Developers

1. **Always validate AI parameters** before rendering
2. **Store comprehensive turn data** for analytics
3. **Handle edge cases** (timeouts, network issues)
4. **Test with real player data** from player-store
5. **Maintain backwards compatibility** with legacy game state

### For AI Integration

1. **Vary template selection** - don't use the same template repeatedly
2. **Match difficulty to game mode** - adjust timers and pressure
3. **Reference previous turns** - create narrative continuity
4. **Use appropriate constraints** - minSelections, maxSelections, etc.
5. **Provide helpful subtitles** - clarify or add humor to prompts

## Testing

Test individual templates:
```typescript
import { TextAreaTemplate } from '@/components/input-templates';

<TextAreaTemplate
  prompt="Test question"
  maxLength={200}
  onSubmit={(r) => console.log(r)}
/>
```

Test all templates in sequence:
```typescript
import { AllTemplatesDemo } from '@/components/input-templates/USAGE_EXAMPLE';

<AllTemplatesDemo />
```

## Extension Points

### Adding New Templates

1. Create component in `components/input-templates/YourTemplate.tsx`
2. Define params interface in `lib/types/template-params.ts`
3. Add to registry in `components/input-templates/index.tsx`
4. Update docs in `README.md`
5. Add validation rules in `validateTemplateParams`

### Adding New Parameters

1. Update interface in `lib/types/template-params.ts`
2. Implement in template component
3. Add validation in `validateTemplateParams`
4. Document in template README

### Custom Response Processing

```typescript
const handleSubmit = (response: any) => {
  // Custom validation
  if (response.text.includes('secret word')) {
    updatePlayerScore(player.id, 50); // Bonus points!
  }

  // Store response
  completeTurn(turn.turnId, response);

  // Trigger AI analysis
  analyzeResponse(response);
};
```

## Troubleshooting

### Template not rendering
- Check that templateType matches registry keys exactly
- Verify all required parameters are provided
- Check browser console for validation errors

### Response not stored
- Ensure `onSubmit` callback is properly connected
- Check game store connection
- Verify turn was created before rendering

### Player data not persisting
- Check localStorage quotas
- Verify player-store is separate from game-store
- Confirm "Start Over" only resets game-store

## Performance Considerations

- Templates use React.memo() for optimization
- Framer Motion animations are GPU-accelerated
- Local storage is automatically debounced by Zustand
- Large word grids (16 items) may need optimization on low-end devices

## Future Enhancements

Potential additions to the system:
- Mini-game templates (e.g., quick reaction games)
- Media upload templates (photo/video responses)
- Drawing canvas template
- Audio recording template
- Multiplayer simultaneous input
- Template theming system
- A/B testing framework

## Support

For questions or issues:
- See [README.md](../components/input-templates/README.md) for template documentation
- See [AI_TEMPLATE_GUIDE.md](./AI_TEMPLATE_GUIDE.md) for AI integration
- See [USAGE_EXAMPLE.tsx](../components/input-templates/USAGE_EXAMPLE.tsx) for code examples

---

**Version:** 1.0.0
**Last Updated:** 2026-01-19
**Status:** Production Ready ✅
