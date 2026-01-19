# Mini-Games System

Interactive challenge sequences that use information learned during gameplay.

## Overview

Mini-games are **different from input templates**:

| Aspect | Input Templates | Mini-Games |
|--------|-----------------|------------|
| Purpose | Collect information | Challenge players |
| Turns | Single turn | Multi-turn conversation |
| AI Prompt | Main Game Master | Dedicated per-game prompt |
| Scoring | Points for participation | Performance-based (0-5) |
| Eligibility | Always available | Act/context restrictions |

## Architecture

```
lib/mini-games/
├── index.ts                    # Exports and registry
├── types.ts                    # Type definitions
├── eligibility.ts              # When mini-games can run
├── trivia-challenge/
│   ├── index.ts                # Core logic
│   └── prompt.ts               # AI prompt for The Quizmaster
└── README.md                   # This file

lib/store/
└── facts-store.ts              # Learned facts database

components/mini-games/
├── index.ts                    # Component exports
└── TriviaChallengeUI.tsx       # Trivia challenge UI
```

## Learned Facts

During Act I, the AI asks questions to collect information. This information is stored as "Learned Facts":

```typescript
interface LearnedFact {
  factId: string;
  sourcePlayerId: string;       // Who provided this
  sourcePlayerName: string;
  category: FactCategory;       // preference, memory, habit, etc.
  originalQuestion: string;     // What was asked
  answer: string;               // What they said
  answerSummary?: string;       // AI-generated summary
  learnedAt: string;            // When learned
  turnId: string;               // Which turn
  usedInChallenges: string[];   // Track usage
  difficulty: 1 | 2 | 3 | 4 | 5;
  eligibleTargets: string[];    // Who can be challenged
}
```

### Fact Categories

- `preference` - "What's your favorite..."
- `memory` - "Remember when..."
- `habit` - "What do you always do..."
- `opinion` - "What do you think about..."
- `secret` - "What's something nobody knows..."
- `prediction` - "What would X do if..."
- `knowledge` - "What's X's favorite..."

## Trivia Challenge

The first mini-game: test players on facts learned from OTHER players.

### Rules

1. **Eligibility**: Only in Act II or Act III
2. **Source Restriction**: Can't ask a player about their OWN answer
3. **Scoring**: 0-5 points based on accuracy

### Flow

```
1. [AI] Selects a fact from another player
2. [AI] Generates question using The Quizmaster prompt
3. [UI] Shows question to target player
4. [Player] Types their answer
5. [AI] Evaluates and scores (0-5)
6. [UI] Shows score with commentary
7. [Store] Updates player score in real-time
```

### The Quizmaster Prompt

The Trivia Challenge uses a dedicated AI personality:

```typescript
buildTriviaChallengePrompt({
  targetPlayer,    // Who's being challenged
  sourcePlayer,    // Who provided the fact
  fact,            // The learned fact
  allPlayers,      // Game context
  scores,          // Current scores
})
```

**Quizmaster traits:**
- Sharp and quick-witted
- Playfully mocks low scores
- Celebrates high scores with surprise
- Keeps commentary to 1-2 sentences

### Scoring Guide

| Score | Meaning |
|-------|---------|
| 5 | Exact match or impressively close |
| 4 | Got the essence, minor details off |
| 3 | Partially correct, knows the person |
| 2 | In the ballpark, missing key elements |
| 1 | Showed effort but way off |
| 0 | Completely wrong or didn't try |

## Usage Example

```typescript
import { useFactsStore } from '@/lib/store';
import { selectFactForChallenge } from '@/lib/mini-games/trivia-challenge';
import { TriviaChallengeUI } from '@/components/mini-games';

// Check eligibility
const { getFactsForChallenge } = useFactsStore();
const eligibleFacts = getFactsForChallenge(currentPlayer.id);

if (currentAct >= 2 && eligibleFacts.length >= 3) {
  // Select best fact
  const fact = selectFactForChallenge({
    targetPlayer: currentPlayer,
    allPlayers: players,
    availableFacts: eligibleFacts,
    scores,
  });

  // Render challenge
  return (
    <TriviaChallengeUI
      targetPlayer={currentPlayer}
      sourcePlayer={getPlayerById(fact.sourcePlayerId)}
      fact={fact}
      allPlayers={players}
      onComplete={({ score, commentary }) => {
        // Handle completion
      }}
    />
  );
}
```

## Adding New Mini-Games

### 1. Define Types

```typescript
// In lib/mini-games/types.ts
export type MiniGameType = 'trivia_challenge' | 'new_game';

export interface NewGameSession extends BaseMiniGameSession {
  gameType: 'new_game';
  // Game-specific fields
}
```

### 2. Add Eligibility

```typescript
// In lib/mini-games/eligibility.ts
function checkNewGameEligibility(context: EligibilityContext): EligibilityResult {
  // Your rules here
}

export const MINI_GAME_REGISTRY: Record<MiniGameType, MiniGameDefinition> = {
  trivia_challenge: { ... },
  new_game: {
    type: 'new_game',
    name: 'New Game',
    description: '...',
    minAct: 2,
    requiresFacts: true,
    checkEligibility: checkNewGameEligibility,
  },
};
```

### 3. Create Prompt

```typescript
// In lib/mini-games/new-game/prompt.ts
export function buildNewGamePrompt(context: ...): string {
  return `You are THE NEW CHARACTER...`;
}
```

### 4. Create UI Component

```typescript
// In components/mini-games/NewGameUI.tsx
export function NewGameUI({ ... }) {
  // Multi-turn conversation UI
}
```

### 5. Export

```typescript
// In lib/mini-games/index.ts
export * from './new-game';

// In components/mini-games/index.ts
export { NewGameUI } from './NewGameUI';
```

## Integration with Game Master

The main Game Master can trigger mini-games by:

1. Checking eligibility based on current act
2. Selecting appropriate mini-game
3. Transitioning to mini-game phase
4. Handling completion and returning to normal flow

Example tool the Game Master could use:

```typescript
{
  "tool": "start_mini_game",
  "type": "trivia_challenge",
  "targetPlayerId": "...",
  "factId": "..."
}
```

## Real-Time Score Updates

Scores update immediately when a mini-game completes:

```typescript
// In TriviaChallengeUI.tsx
const updatePlayerScore = useGameStore((state) => state.updatePlayerScore);

// After AI scores
updatePlayerScore(targetPlayer.id, scoreResult.score);
```

The GameProgressBar and any score displays will update automatically via Zustand reactivity.

## Future Mini-Games (Ideas)

- **Speed Round**: Rapid-fire questions, time-limited
- **Lie Detector**: Guess which statement is false
- **Family Feud**: Survey-style scoring
- **Finish the Sentence**: Complete another player's thought
- **Role Reversal**: Answer as if you were another player

---

**Status:** ✅ Production Ready
**Last Updated:** 2026-01-19
