# Game Flow Issues

This document lists known issues based on the current codebase. It is meant to be updated as fixes are applied.

Last updated: 2026-01-20

## Resolved (v1.1.1)

### ✓ 1. Hard Trivia props mismatch

- **Resolution**: Renamed `currentPlayer` to `targetPlayer` in `HardTriviaUI` to match mini-game convention. Added `turns` prop to all mini-game renders.
- **Fixed in**: v1.1.1

### ✓ 2. Hook usage inside conditional

- **Resolution**: Moved `useState` call out of conditional error render block in `/play` to comply with Rules of Hooks.
- **Fixed in**: v1.1.1

### ✓ 3. Mini-games do not create turns

- **Resolution**: Mini-games now create turn entries via `addTurn()` and complete them with results, fixing game progression stalls in Act 2+.
- **Fixed in**: v1.1.1

## High

### 4. End-game restart does not reset game state

- Severity: High
- Location: `components/EndGameResults.tsx`

The "Play Again" button only routes to `/setup` and does not call `startNewGame()` or `resetGame()`. `gameId` and turn history persist.

### 5. Hard Trivia scores are not applied to the store

- Severity: High
- Location: `components/mini-games/HardTriviaUI.tsx`, `app/play/page.tsx`

Hard Trivia returns a score in `MiniGameResult` but does not update `useGameStore().scores`. `/play` also does not apply the score on completion.

## Low

### ✓ 6. SlideToUnlock is unused

- **Resolution**: This is intentional design. The pass screen uses a large button for better mobile UX.
- **Status**: Working as intended
