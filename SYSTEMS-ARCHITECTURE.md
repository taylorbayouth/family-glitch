# 🎮 Family Glitch - Systems-First Architecture

## Overview

This is a complete rewrite focusing on **composable subsystems** instead of hardcoded mini-games. The game now has **dramatic arc pacing** with three acts that intensify over time.

---

## Core Philosophy

**OLD**: Game logic spread across components, mini-games hardcoded, no arc
**NEW**: Universal subsystems, composable cartridges, AI-driven 3-act structure

---

## Game Arc System

### Three Acts
```
ACT 1 (Turns 1-4)  - Building The Vault
  • Focus: Data collection
  • Intensity: Low
  • Cartridges: Simple games (LETTER_CHAOS)
  • Goal: Build foundation of family facts

ACT 2 (Turns 5-8)  - The Twist
  • Focus: Mix of collection + recall
  • Intensity: Medium
  • Cartridges: Complex games (VAULT_RECALL, CAPTION_THIS, MAD_LIBS)
  • Goal: Use collected data creatively

ACT 3 (Turns 9-12) - The Climax
  • Focus: Pure callbacks and chaos
  • Intensity: High
  • Cartridges: Consensus games, recall-heavy
  • Goal: Maximum laughs, no new fact building
```

### Arc-Aware State Manager

The store automatically calculates which act you're in:
```typescript
getCurrentAct() → 'ACT_1' | 'ACT_2' | 'ACT_3'
isInAct('ACT_3') → boolean
```

Turns 1-4 = ACT_1, 5-8 = ACT_2, 9-12 = ACT_3

---

## Subsystems

### 1. Storage Subsystem

**Purpose**: Universal data storage with scoping and tagging

**Schema**:
```typescript
interface StoredData {
  id: string;
  value: string | string[] | number;
  input_type: 'text' | 'choice' | 'multi_choice' | 'rating' | 'numeric' | 'media_url';
  question: string;
  source_player_id: string;
  target_player_id?: string;      // For cross-player requests
  scope: 'permanent' | 'turn' | 'deferred';
  tags: string[];                 // ['mad_libs_noun', 'horse_racing', 'caption']
  turn_collected: number;
  metadata?: Record<string, any>;
}
```

**Scopes**:
- `permanent`: Lasts entire game (family facts, preferences)
- `turn`: Cleared after current turn (temporary game state)
- `deferred`: Stored now, used later (mad libs words, cross-turn data)

**Query Interface**:
```typescript
getStoredData(['mad_libs_noun'], 'deferred')
getStoredData(['caption'], 'permanent')
clearTurnScopedStorage()
```

### 2. Rating Subsystem

**Purpose**: Multi-dimensional peer rating

**Schema**:
```typescript
interface RatingResult {
  data_id: string;                              // What StoredData is being rated
  rater_player_id: string;                      // Who rated it
  ratings: Record<RatingDimension, number>;     // { funniness: 4, cleverness: 3 }
  turn_rated: number;
}

type RatingDimension = 'accuracy' | 'funniness' | 'cleverness' | 'overall';
```

**UI Component**: `TheRatingScreen`
- Dynamically shows sliders based on `dimensions` array
- Supports 1-5 dimensions at once
- Configurable min/max values
- Shows average rating for multi-dimensional ratings

**Example Usage**:
```typescript
// Rate a caption on funniness and cleverness
interface: {
  type: 'THE_RATING_SCREEN',
  data: {
    dimensions: ['funniness', 'cleverness'],
    min_value: 1,
    max_value: 5,
    target_content: "Why did the chicken cross the road?",
    target_media_url: "https://...",
    author_name: "Taylor",
    author_avatar: "🦄",
    prompt: "Rate this caption"
  }
}
```

### 3. Turn Actions Subsystem

**Purpose**: Support multi-step turns (multiple questions, cross-player requests)

**Schema**:
```typescript
interface CurrentTurn {
  player_id: string;
  cartridge?: GameCartridge;      // Which game is active
  actions: TurnAction[];          // Queue of actions to complete
  current_action_index: number;   // Progress through actions
  temp_data: Record<string, any>; // Temporary turn data
}

interface TurnAction {
  type: 'collect_data' | 'render_media' | 'rate_peer' | 'cross_player_request';
  interface: InputInterface;
  data: InterfaceData;
  requires_completion: boolean;
  stores_as?: {
    scope: StorageScope;
    tags: string[];
  };
}
```

**Example - Multi-Step Caption Game**:
```typescript
current_turn: {
  player_id: 'p1',
  cartridge: 'CAPTION_THIS',
  actions: [
    { type: 'render_media', interface: 'THE_IMAGE_GENERATOR', ... },  // Show image
    { type: 'collect_data', interface: 'THE_SECRET_CONFESSIONAL', ... }  // Write caption
  ],
  current_action_index: 0
}
```

---

## Game Cartridges

Cartridges are **composable mini-games** that use subsystems. Each cartridge has metadata defining when it can be played:

```typescript
export const CARTRIDGE_LIBRARY: Record<GameCartridge, CartridgeMetadata> = {
  LETTER_CHAOS: {
    id: 'LETTER_CHAOS',
    name: 'Letter Chaos',
    description: 'Fill in 2 words using given letters',
    min_players: 2,
    requires_vault_facts: 0,
    allowed_in_acts: ['ACT_1', 'ACT_2'],
    complexity: 'low',
    uses_subsystems: ['storage'],
  },
  // ... 4 more cartridges
};
```

### Current Cartridges

1. **LETTER_CHAOS** (ACT 1-2)
   - Simple word game
   - No vault data needed
   - Low complexity

2. **VAULT_RECALL** (ACT 2-3)
   - Trivia from stored facts
   - Requires 6+ vault facts
   - Medium complexity

3. **CAPTION_THIS** (All Acts)
   - Write caption for generated image
   - Others rate it
   - Uses: storage, rating, media_generation

4. **MAD_LIBS** (ACT 2-3)
   - Collect words from multiple players
   - Generate story using deferred storage
   - High complexity

5. **CONSENSUS** (ACT 2-3)
   - Everyone answers same question
   - Points for matching answers
   - Requires 3+ vault facts

---

## State Management

### Store Structure

```typescript
interface GameState {
  meta: {
    turn_count: number;
    max_turns: number;
    current_player_index: number;
    phase: 'SETUP' | 'PLAYING' | 'FINALE';
    arc: GameArc;                        // Track which act we're in
    game_started_at: number;
    vibe: string;
  };
  players: Player[];
  storage: StoredData[];                 // Universal storage
  ratings: RatingResult[];               // All ratings given
  current_turn: CurrentTurn;             // Multi-action turn support
  score_history: ScoreEvent[];
}
```

### Key Store Methods

**Arc Management**:
```typescript
getCurrentAct() → GameAct
isInAct(act: GameAct) → boolean
```

**Storage**:
```typescript
addStoredData(data: StoredData)
getStoredData(tags?: string[], scope?: StorageScope) → StoredData[]
clearTurnScopedStorage()
```

**Rating**:
```typescript
addRating(rating: RatingResult)
getRatingsForData(data_id: string) → RatingResult[]
```

**Turn Management**:
```typescript
nextTurn()                              // Auto-calculates new act
updateCurrentTurn(data: Partial<CurrentTurn>)
clearCurrentTurn()
```

---

## AI Prompt Strategy

### Act-Aware Game Selection

The AI should follow these rules:

**ACT 1 (Turns 1-4)**: Building Phase
- Heavy data collection (60% of turns)
- Use LETTER_CHAOS or simple games
- Store facts with tags: `['family_lore', 'preferences', 'history']`
- Build vault to minimum 6 facts

**ACT 2 (Turns 5-8)**: Twist Phase
- Mix collection (30%) and recall (70%)
- Use VAULT_RECALL, CAPTION_THIS, start MAD_LIBS
- Begin using stored data creatively
- Introduce peer rating

**ACT 3 (Turns 9-12)**: Climax Phase
- **NO NEW FACT BUILDING** (critical rule)
- Pure recall and callback games
- Use CONSENSUS, complete MAD_LIBS
- Maximum complexity and callbacks

### Cartridge Selection Logic

```typescript
function selectCartridge(gameState: GameState): GameCartridge {
  const { turn_count, arc } = gameState.meta;
  const vaultSize = gameState.storage.filter(s => s.scope === 'permanent').length;
  const playerCount = gameState.players.length;

  // Filter cartridges by:
  // 1. Current act
  // 2. Vault size requirement
  // 3. Player count

  const eligible = Object.values(CARTRIDGE_LIBRARY).filter(c =>
    c.allowed_in_acts.includes(arc.current_act) &&
    c.requires_vault_facts <= vaultSize &&
    c.min_players <= playerCount
  );

  // In ACT_3, prefer high-complexity games
  if (arc.current_act === 'ACT_3') {
    return eligible.filter(c => c.complexity === 'high')[0] || eligible[0];
  }

  return randomChoice(eligible);
}
```

---

## Example Game Flows

### Example 1: Caption This (Cross-Turn Game)

**Turn 5 - Player 1**:
1. AI generates image via DALL-E
2. Player 1 writes caption
3. Store caption with tags: `['caption', 'unrated']`

**Turn 6 - Player 2**:
1. Show Player 1's image + caption
2. Rate on funniness (1-5)
3. Store rating
4. Award points to Player 1 based on rating

**Turn 7 - Player 3**:
1. Also rates Player 1's caption on cleverness
2. Average ratings = final score

### Example 2: Mad Libs (Deferred Storage)

**Turn 6 - Player 1**:
```typescript
// AI requests noun from Player 2
interface: {
  type: 'THE_SECRET_CONFESSIONAL',
  data: {
    question: "Player 2, give us a noun related to horse racing",
    placeholder: "saddle, jockey, track..."
  }
}

// Store with deferred scope
storage: [{
  id: "ml_noun_1",
  value: "saddle",
  scope: "deferred",
  tags: ["mad_libs_noun", "horse_racing"],
  source_player_id: "p2",
  target_player_id: "p1"
}]
```

**Turn 8 - Back to Player 1**:
```typescript
// AI queries deferred storage
const mlNouns = getStoredData(['mad_libs_noun'], 'deferred');

// Generate mad libs story using collected words
const story = `Once upon a time, ${mlNouns[0].value} went to the ${mlNouns[1].value}...`;

// Display via THE_GALLERY
interface: {
  type: 'THE_GALLERY',
  data: {
    art_string: story,
    caption: "Your Mad Libs Masterpiece"
  }
}
```

---

## Migration from V2

### What Changed

**Deleted**:
- `MiniGame` enum (replaced by `GameCartridge` with metadata)
- `VaultFact` interface (replaced by `StoredData` with tags)
- `CurrentTurnData` interface (replaced by `CurrentTurn` with actions)
- Game-specific fields (`secret_letters`, `ascii_art`, etc.)

**Added**:
- `GameArc` system with automatic act calculation
- `StoredData` with scoping and tagging
- `RatingResult` for peer ratings
- `CurrentTurn` with multi-action support
- `CARTRIDGE_LIBRARY` with game metadata

### Existing Components Still Work

These components are unchanged:
- `TheSecretConfessional` (text input)
- `TheGallery` (ASCII art display)
- `TheSelector` (multiple choice)
- `TheHandoff` (pass to next player)
- `TheImageGenerator` (show image) - needs update for DALL-E integration

New component:
- `TheRatingScreen` (multi-dimensional rating sliders)

---

## Next Steps

1. **Build AI Prompt System**
   - Arc-aware cartridge selection
   - Deferred storage query logic
   - Multi-turn game orchestration

2. **Integrate DALL-E**
   - Image generation for CAPTION_THIS
   - Store image URLs in storage with `media_url` type

3. **Update GameOrchestrator**
   - Handle multi-action turns
   - Route to TheRatingScreen

4. **Create Cartridge Implementations**
   - Write prompt templates for each cartridge
   - Define multi-step flows for complex games

5. **Test Arc Pacing**
   - Play through full 12-turn game
   - Verify ACT_3 has no new fact building
   - Ensure intensity ramps up

---

## File Structure

```
src/
├── types/
│   └── game.ts                          ← NEW: Systems-first types
├── lib/
│   ├── gameStore.ts                     ← NEW: Arc-aware store
│   └── prompts.ts                       ← TODO: Arc-aware AI prompts
├── components/
│   ├── TheSecretConfessional.tsx        ← Existing
│   ├── TheGallery.tsx                   ← Existing
│   ├── TheSelector.tsx                  ← Existing
│   ├── TheHandoff.tsx                   ← Existing
│   ├── TheImageGenerator.tsx            ← TODO: Update for DALL-E
│   └── TheRatingScreen.tsx              ← NEW: Multi-dimensional rating
└── app/
    └── api/turn/route.ts                ← TODO: Update for new types
```

---

## Key Design Principles

1. **Systems Over Games**: Build reusable subsystems, compose into cartridges
2. **Arc-Driven Pacing**: Game must have dramatic structure (setup → twist → climax)
3. **Data Scoping**: `permanent` vs `turn` vs `deferred` storage
4. **Tagging Strategy**: Use tags for flexible querying (`['mad_libs_noun', 'horse_racing']`)
5. **Multi-Dimensional Rating**: Flexible rating UI that adapts to dimensions requested
6. **No Hardcoded Logic**: AI decides everything, frontend just renders

---

**This architecture is production-ready for the core systems. Now we need to build the AI prompt logic and integrate DALL-E.**
