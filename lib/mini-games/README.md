# Mini-Games System

Mini-games are interactive challenge sequences triggered by AI tools. They run inside `/play` and have their own AI prompts and scoring logic.

## How It Works

1. The Game Master tool call returns a mini-game template type (e.g., `trivia_challenge`).
2. `/play` checks `isMiniGame(templateType)` and loads the registry config.
3. The mini-game UI component renders and handles its own AI calls.
4. The mini-game calls `onComplete()` with a `MiniGameResult`.
5. `/play` creates a Turn entry and updates the player's score.

## Shared Components (v1.2.0)

All mini-games now use shared components from `components/mini-games/shared/`:

- **LoadingSpinner**: Animated loading indicator with ARIA labels
- **ScoreDisplay**: Large animated score card with accessibility support
- **CommentaryCard**: AI commentary display with emoji
- **ErrorToast**: Fixed error notification with retry/dismiss
- **IntroScreen**: Full-screen animated intro with game-specific theming

Shared utilities in `lib/mini-games/utils.ts` and themes in `lib/mini-games/themes.ts`.

## Mini-Game Registry

- Registry: `lib/mini-games/registry.ts`
- Each mini-game registers itself in `lib/mini-games/<game>/register.ts`
- `lib/mini-games/index.ts` imports all registrations to self-register

## Available Mini-Games

### Trivia Challenge
- **Type**: `trivia_challenge`
- **Trigger**: `trigger_trivia_challenge`
- **UI**: `components/mini-games/TriviaChallengeUI.tsx`
- **Theme**: Glitch (purple)
- Uses a past completed turn from another player. Scores 0-5 based on answer accuracy.

### Hard Trivia
- **Type**: `hard_trivia`
- **Trigger**: `trigger_hard_trivia`
- **UI**: `components/mini-games/HardTriviaUI.tsx`
- **Theme**: Cyan
- Multiple-choice trivia based on player interests. Scores 0-5 based on correctness.

### Personality Match
- **Type**: `personality_match`
- **Trigger**: `trigger_personality_match`
- **UI**: `components/mini-games/PersonalityMatchUI.tsx`
- **Theme**: Mint
- Generates a word grid and scores based on past turns about the subject player. Scores 0-5.

### Mad Libs Challenge
- **Type**: `madlibs_challenge`
- **Trigger**: `trigger_madlibs_challenge`
- **UI**: `components/mini-games/MadLibsUI.tsx`
- **Theme**: Amber
- Fill-in-the-blank story with letter constraints. Scores 0-5 based on creativity.

### Cryptic Connection
- **Type**: `cryptic_connection`
- **Trigger**: `trigger_cryptic_connection`
- **UI**: `components/mini-games/CrypticConnectionUI.tsx`
- **Theme**: Violet
- 5×5 word grid with mystery word. Scores 0-5 with fuzzy AI matching.

### The Filter
- **Type**: `the_filter`
- **Trigger**: `trigger_the_filter`
- **UI**: `components/mini-games/TheFilterUI.tsx`
- **Theme**: Teal
- Grid-based selection game with pattern recognition. Scores 0-5 based on selections.

## Eligibility

Eligibility helpers live in `lib/mini-games/eligibility.ts`:

- `getEligibleTurnsForPlayer()`
- `MINI_GAME_ELIGIBILITY` (not currently used by `/play`)

`/play` uses `getEligibleTurnsForPlayer()` to build trivia eligibility data for the Game Master prompt.

## File Structure

```
lib/mini-games/
  registry.ts           # Central mini-game registry
  eligibility.ts        # Turn eligibility logic
  types.ts              # TypeScript types
  utils.ts              # Shared utility functions (v1.2.0)
  themes.ts             # Game themes and colors (v1.2.0)
  trivia-challenge/     # Trivia Challenge game
  hard-trivia/          # Hard Trivia game
  personality-match/    # Personality Match game
  madlibs-challenge/    # Mad Libs Challenge game
  cryptic-connection/   # Cryptic Connection game
  the-filter/           # The Filter game
```

## No Facts Store

`lib/store/facts-store.ts` is intentionally empty. Turns are the source of truth for trivia and personality scoring.
