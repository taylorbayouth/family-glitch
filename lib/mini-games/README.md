# Mini-Games System

Mini-games are interactive challenge sequences triggered by AI tools. They run inside `/play` and have their own AI prompts and scoring logic.

## How It Works

1. The Game Master tool call returns a mini-game template type (e.g., `trivia_challenge`).
2. `/play` checks `isMiniGame(templateType)` and loads the registry config.
3. The mini-game UI component renders and handles its own AI calls.
4. The mini-game calls `onComplete()` with a `MiniGameResult`.

Important current behavior:
- `/play` does not create `Turn` entries for mini-games.
- Trivia, Personality Match, Mad Libs, and Cryptic Connection update scores internally with `useGameStore()`.
- Hard Trivia returns a `MiniGameResult` but does not update scores inside the component.

## Mini-Game Registry

- Registry: `lib/mini-games/registry.ts`
- Each mini-game registers itself in `lib/mini-games/<game>/register.ts`
- `lib/mini-games/index.ts` imports all registrations to self-register

## Available Mini-Games

### Trivia Challenge

- Trigger: `trigger_trivia_challenge`
- UI: `components/mini-games/TriviaChallengeUI.tsx`
- Uses a past completed turn from another player
- Scores 0 to 5, updates the target player's score

### Personality Match

- Trigger: `trigger_personality_match`
- UI: `components/mini-games/PersonalityMatchUI.tsx`
- Generates a word grid and scores based on past turns about the subject player
- Scores 0 to 5, updates the target player's score

### Mad Libs Challenge

- Trigger: `trigger_madlibs_challenge`
- UI: `components/mini-games/MadLibsUI.tsx`
- Generates a fill-in-the-blank template and scores creativity
- Scores 0 to 5, updates the target player's score

### Cryptic Connection

- Trigger: `trigger_cryptic_connection`
- UI: `components/mini-games/CrypticConnectionUI.tsx`
- Generates a cryptic clue and a 5x5 word grid
- Scores 0 to 5 with fuzzy matching, updates the target player's score

### Hard Trivia

- Trigger: `trigger_hard_trivia`
- UI: `components/mini-games/HardTriviaUI.tsx`
- Multiple-choice trivia based on player interests
- Returns a `MiniGameResult` (max score 5)

## Eligibility

Eligibility helpers live in `lib/mini-games/eligibility.ts`:

- `getEligibleTurnsForPlayer()`
- `MINI_GAME_ELIGIBILITY` (not currently used by `/play`)

`/play` uses `getEligibleTurnsForPlayer()` to build trivia eligibility data for the Game Master prompt.

## File Structure

```
lib/mini-games/
  registry.ts
  eligibility.ts
  types.ts
  trivia-challenge/
  personality-match/
  madlibs-challenge/
  cryptic-connection/
  hard-trivia/
```

## No Facts Store

`lib/store/facts-store.ts` is intentionally empty. Turns are the source of truth for trivia and personality scoring.
