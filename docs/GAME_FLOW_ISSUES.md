# Game Flow Issues

This document lists known issues based on the current codebase. It is meant to be updated as fixes are applied.

Last updated: 2026-01-21

## Resolved

### ✓ 1. Hard Trivia props mismatch
- **Resolution**: Renamed `currentPlayer` to `targetPlayer` in `HardTriviaUI` to match mini-game convention. Added `turns` prop to all mini-game renders.
- **Fixed in**: v1.1.1

### ✓ 2. Hook usage inside conditional
- **Resolution**: Moved `useState` call out of conditional error render block in `/play` to comply with Rules of Hooks.
- **Fixed in**: v1.1.1

### ✓ 3. Mini-games do not create turns
- **Resolution**: Mini-games now create turn entries via `addTurn()` and complete them with results, fixing game progression stalls in Act 2+.
- **Fixed in**: v1.1.1

### ✓ 4. End-game restart does not reset game state
- **Resolution**: "Play Again" button now calls `resetGame()` before routing to `/setup`.
- **Fixed in**: v1.1.1

### ✓ 5. Hard Trivia scores are not applied to the store
- **Resolution**: `/play` now properly calls `updatePlayerScore()` in `handleMiniGameComplete()` to apply mini-game scores.
- **Fixed in**: v1.1.1

### ✓ 6. SlideToUnlock is unused
- **Resolution**: This is intentional design. The pass screen uses a large button for better mobile UX.
- **Status**: Working as intended

### ✓ 7. Mini-game eligibility too restrictive
- **Resolution**: Removed `>= 3 turns` constraint. Trivia/Personality Match now available with just 1 eligible turn since Act 1 collects data.
- **Fixed in**: v1.1.3

### ✓ 8. AI questions too cautious for older kids
- **Resolution**: Completely rewrote Game Master prompt to be goal-focused. Removed "family-friendly" language. Treat 10+ as pre-teens/teens.
- **Fixed in**: v1.1.3

## Open Issues

No known critical issues at this time.

## Feature Requests

See [ROADMAP.md](../ROADMAP.md) for planned enhancements.
