# Cartridge Architecture

## Overview

Cartridges are **completely self-contained mini-games** that run during Act 2. They are 100% independent from the game's state machine and can be infinitely extended without modifying core game logic.

## Design Principles

### 1. **True Independence**
- Cartridges are **modules**, not screens
- They receive a `CartridgeContext` and return a `CartridgeResult`
- They manage their own internal state and UI flow
- They control viewing mode (private/public/pass-around)
- They can hand the phone to specific players, put it on the table, etc.

### 2. **Scoring is Optional**
- **Not all cartridges award points!**
- Some cartridges are for:
  - Information gathering
  - Group decisions/voting
  - Entertainment without competition
  - Ranking/preference collection
- Cartridges that DO score can use the optional `ScoringReveal` component

### 3. **Extensibility**
- New cartridges can be added without touching core game code
- Just create a file, export a `CartridgeDefinition`, and register it
- The cartridge registry handles selection and lifecycle

## Core Types

### CartridgeContext
What the game provides to cartridges:

```typescript
interface CartridgeContext {
  sessionId: string;
  players: Player[];
  factsDB: FactsDB;           // Facts from Act 1
  eventLog: EventLog;          // Game history
  currentScores: Record<string, number>;
  safetyMode: 'kid-safe' | 'teen-adult';
  elapsedTime: number;
  remainingTime: number;

  // Helper functions
  recordEvent: (event) => void;
  updateScores: (deltas) => void;
  requestLLM: (request) => Promise<LLMResponse>;
}
```

### CartridgeResult
What cartridges return when complete:

```typescript
interface CartridgeResult {
  completed: boolean;
  turnPacket: TurnPacket;      // Complete record
  scoreChanges: Record<string, number>;  // {} if no scoring
  highlights?: string[];        // For Act 3
  skipped?: boolean;
  skipReason?: string;
}
```

### CartridgeDefinition
The cartridge module interface:

```typescript
interface CartridgeDefinition {
  // Metadata
  id: string;
  name: string;
  description: string;
  icon: string;
  estimatedDuration: number;
  tags: string[];

  // Requirements
  minPlayers: number;
  maxPlayers: number;
  requiredFactCategories?: string[];
  minFacts?: number;

  // Selection logic
  canRun: (context) => boolean;
  getRelevanceScore: (context) => number;

  // React component
  Component: React.ComponentType<CartridgeProps>;
}
```

## How Cartridges Work

### 1. **Registration**
```typescript
import { cartridgeRegistry } from '@/lib/cartridgeRegistry';
import { triviaCartridge } from '@/components/cartridges/TriviaCartridge';

cartridgeRegistry.register(triviaCartridge);
```

### 2. **Selection**
The game (or LLM) selects the next cartridge:
```typescript
const nextCartridge = await cartridgeRegistry.selectNext(context, useLLM);
```

Selection considers:
- Player count requirements
- Fact availability
- Recent cartridge history (avoid repetition)
- Time remaining
- Relevance scores

### 3. **Execution**
The cartridge component receives context and runs:
```typescript
<CartridgeComponent
  context={cartridgeContext}
  onComplete={(result) => handleCartridgeComplete(result)}
/>
```

### 4. **Completion**
The cartridge signals completion by calling `onComplete(result)`:
- Game receives `CartridgeResult`
- Updates scores if provided
- Records events
- Stores turn packet
- Selects next cartridge or transitions to Act 3

## Internal Cartridge Flow

Each cartridge manages its own phases. Example from TriviaCartridge:

```typescript
type Phase = 'intro' | 'show-fact' | 'collect-guesses' | 'reveal-score';

function TriviaCartridge({ context, onComplete }) {
  const [phase, setPhase] = useState<Phase>('intro');

  // Cartridge controls its own transitions
  if (phase === 'intro') return <IntroScreen />;
  if (phase === 'show-fact') return <FactScreen />;
  if (phase === 'collect-guesses') return <GuessScreen />;
  if (phase === 'reveal-score') return <ScoringReveal />;
}
```

## Scoring (Optional)

### Cartridges WITHOUT Scoring
Example: **Would You Rather**

```typescript
const result: CartridgeResult = {
  completed: true,
  turnPacket: turnPacket,
  scoreChanges: {},  // Empty - no points awarded
};
```

No need to use `ScoringReveal` - just show results however you want.

### Cartridges WITH Scoring
Example: **Trivia**

```typescript
// 1. Calculate scores
const scoreChanges = { 'player-1': 10, 'player-2': 0 };

// 2. Build scoring reveal data
const scoringData: ScoringRevealData = {
  mode: 'sequential',
  title: 'Who Said That?',
  reveals: [
    {
      playerId: 'player-1',
      answer: 'Guessed: Taylor',
      points: 10,
      explanation: '🎯 Correct! Taylor did say that!',
      suspenseDelay: 2000,
    },
    // ...
  ],
  summary: '2 out of 3 players guessed correctly!',
  celebration: 'confetti',
};

// 3. Render scoring reveal
<ScoringReveal
  data={scoringData}
  players={context.players}
  onComplete={handleComplete}
/>

// 4. Return result with score changes
const result: CartridgeResult = {
  completed: true,
  turnPacket: turnPacket,
  scoreChanges: scoreChanges,  // Actual points
};
```

## LLM Integration

Cartridges can request LLM generation at any point:

```typescript
const response = await context.requestLLM({
  purpose: 'score-answers',
  context: {
    cartridgeId: 'trivia',
    cartridgeName: 'Who Said That?',
    currentPhase: 'scoring',
    submissions: { 'player-1': 'Taylor', 'player-2': 'Beth' },
  },
  instructions: 'Evaluate each guess and explain why...',
});
```

### LLM Scoring with Explanations

For exciting reveals:
1. Cartridge collects submissions
2. Sends to LLM for evaluation
3. LLM returns scores + reasoning
4. Build `ScoringRevealData` with explanations
5. Use `ScoringReveal` component for dramatic presentation

## Example Cartridges

### 1. Trivia Cartridge (WITH Scoring)
- **File**: `components/cartridges/TriviaCartridge.tsx`
- **Flow**: Intro → Show Fact → Collect Guesses → Score & Reveal
- **Scoring**: Yes (10 points per correct guess)
- **Uses**: `ScoringReveal` component

### 2. Would You Rather (NO Scoring)
- **File**: `components/cartridges/WouldYouRatherCartridge.tsx`
- **Flow**: Intro → Show Question → Collect Votes → Show Results
- **Scoring**: No (just for fun)
- **Uses**: Custom reveal screen (no `ScoringReveal`)

## Viewing Modes

Cartridges can control how content is viewed:

### Private (Pass-Around)
```typescript
// Show prompt, pass phone to each player for private input
<PrivateInputScreen currentPlayer={players[index]} />
```

### Public (Phone on Table)
```typescript
// Everyone sees at once
<PublicRevealScreen showToEveryone={true} />
```

### Mixed
```typescript
// Example: Public intro, private input, public reveal
if (phase === 'intro') return <PublicIntro />;
if (phase === 'input') return <PrivateInput />;
if (phase === 'reveal') return <PublicReveal />;
```

## State Machine Integration

The game's state machine has a single Act 2 state:
- `ACT2_CARTRIDGE_ACTIVE`

While in this state:
- The active cartridge has full control
- Game orchestrator just waits for `onComplete()`
- When cartridge completes, game decides:
  - Load next cartridge, OR
  - Transition to Act 3

No need to add state machine states for each cartridge screen!

## Creating a New Cartridge

### 1. Create the file
```typescript
// components/cartridges/MyCartridge.tsx

export const myCartridge: CartridgeDefinition = {
  id: 'my-cartridge',
  name: 'My Awesome Game',
  description: 'A fun game that...',
  icon: '🎮',
  estimatedDuration: 180000,
  tags: ['fun', 'creative'],

  minPlayers: 2,
  maxPlayers: 8,
  minFacts: 3,

  canRun: (context) => context.factsDB.facts.length >= 3,
  getRelevanceScore: (context) => 0.8,

  Component: MyCartridgeComponent,
};

function MyCartridgeComponent({ context, onComplete }: CartridgeProps) {
  // Your cartridge logic here
  // Manage your own phases, screens, flow
  // Call onComplete(result) when done
}
```

### 2. Register it
```typescript
// lib/cartridgeRegistry.ts

import { myCartridge } from '@/components/cartridges/MyCartridge';

export function registerAllCartridges() {
  cartridgeRegistry.register(myCartridge);
  // ... other cartridges
}
```

### 3. Done!
Your cartridge is now available and will be selected based on relevance.

## Best Practices

### 1. **Log Events**
```typescript
context.recordEvent({
  type: 'ANSWER_SUBMITTED',
  actNumber: 2,
  activePlayerId: player.id,
  answer: submission,
});
```

### 2. **Build Complete TurnPackets**
```typescript
const turnPacket = createTurnPacket({
  sessionId: context.sessionId,
  actNumber: 2,
  cartridgeId: 'my-cartridge',
  prompt: { type: 'text', text: 'The prompt' },
  relevance: { why: 'Why this was chosen', confidence: 0.9 },
  scoringConfig: scoringMode === 'none' ? undefined : { ... },
});
```

### 3. **Update Scores Atomically**
```typescript
// Calculate all score changes first
const scoreChanges = { 'player-1': 10, 'player-2': 5 };

// Then update once
context.updateScores(scoreChanges);

// Then return in result
return { completed: true, scoreChanges, ... };
```

### 4. **Handle Errors Gracefully**
```typescript
try {
  const response = await context.requestLLM(...);
  // Use LLM response
} catch (error) {
  console.error('LLM failed:', error);
  // Fall back to hardcoded content
}
```

### 5. **Make Timing Clear**
```typescript
// For sequential reveals
suspenseDelay: 2000,  // 2 seconds per player

// For auto-advance
useEffect(() => {
  const timeout = setTimeout(advance, 3000);
  return () => clearTimeout(timeout);
}, [phase]);
```

## Architecture Benefits

1. **True Modularity**: Cartridges are completely independent
2. **Infinite Extensibility**: Add new games without core changes
3. **Flexible Scoring**: Optional, controlled by cartridge
4. **LLM Integration**: Cartridges can use LLM whenever needed
5. **Viewing Flexibility**: Public, private, or mixed modes
6. **Clean Separation**: Game manages between-cartridge, cartridge manages within

## What's Next

1. **Create More Cartridges**:
   - Caption contest (LLM judges captions)
   - Word association (no scoring)
   - Ranking game (no scoring)
   - Drawing challenge (if image generation added)

2. **Enhance Registry**:
   - Category filtering (competitive vs casual)
   - Difficulty levels
   - Play history tracking
   - "Play again" requests

3. **Polish Reveals**:
   - More animation options
   - Sound effects
   - Better celebration effects

4. **Analytics**:
   - Track which cartridges are most popular
   - Adjust relevance scores based on actual engagement
   - Learn player preferences over time

---

**Key Takeaway**: Cartridges are **fully independent mini-games**. They control their own flow, optionally award points, and use reusable components (like `ScoringReveal`) when it makes sense. This architecture allows infinite game variety without complexity.
