# Implementation Summary

This document summarizes the current game flow and major systems in the codebase.

## What Is Implemented

### Game Flow

- Player setup at `/setup` (2 to 7 players)
- Pass-to-player screen with AI preloading
- Question templates rendered via `TemplateRenderer`
- AI commentary with manual "Pass to {next}" progression
- End-game results via `EndGameResults` and `/api/announcer`

### Input Templates

- Text Area (`tpl_text_area`)
- Text Input (`tpl_text_input`)
- Timed Binary (`tpl_timed_binary`)
- Word Grid (`tpl_word_grid`, supports 4/9/16/25)
- Slider (`tpl_slider`)
- Player Selector (`tpl_player_selector`)

### Mini-Games

- Trivia Challenge
- Personality Match
- Mad Libs Challenge
- Cryptic Connection
- Hard Trivia

Mini-games are registered via `lib/mini-games/registry.ts` and rendered dynamically in `/play`.

### State Management

- `usePlayerStore`: roster persists in localStorage
- `useGameStore`: turn-based game state and scores
- Progress helpers (acts, rounds, progress percentage)

### AI Integration

- `/api/chat` uses GPT-5.2 chat completions with tool calling
- Template tools return JSON configs for UI rendering
- `/api/announcer` generates end-game rankings and blurbs

## Key Files

- `app/play/page.tsx` (core game controller)
- `lib/ai/template-tools.ts` (tools + mini-game triggers)
- `lib/ai/game-master-prompt.ts` (system prompt)
- `lib/mini-games/` (registry + prompt builders)
- `components/input-templates/` (template UIs)
- `components/mini-games/` (mini-game UIs)

## Known Limitations (Current Code)

- `/play` does not create `Turn` entries for mini-games.
- `HardTriviaUI` returns a score but does not update the game store directly.
- `EndGameResults` does not reset the game store when "Play Again" is clicked.

## Next Steps (If Desired)

- Add turn creation for mini-games
- Ensure Hard Trivia scores update the store
- Reset game state when restarting from end-game
- Add validation for AI template configs in `/play`
- Add automated tests
