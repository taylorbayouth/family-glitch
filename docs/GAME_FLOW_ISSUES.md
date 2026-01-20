# Game Flow Issues

This document lists known issues based on the current codebase. It is meant to be updated as fixes are applied.

## Critical

### 1. Hard Trivia props mismatch

- Severity: Critical (runtime crash when triggered)
- Location: `components/mini-games/HardTriviaUI.tsx`, `lib/mini-games/hard-trivia/register.ts`, `app/play/page.tsx`

`HardTriviaUI` expects `currentPlayer`, `turns`, and a `config` prop, but `/play` passes `targetPlayer` and does not pass `turns` or `config`. If `hard_trivia` is triggered, the component renders with missing props.

### 2. Hook usage inside conditional

- Severity: Critical
- Location: `app/play/page.tsx`

`useState` is called inside the `if (error)` conditional block. This violates the rules of hooks and can crash the page.

### 3. Mini-games do not create turns

- Severity: Critical
- Location: `app/play/page.tsx`

Mini-game rounds do not add a `Turn` entry to the game store. Progress and end-game checks rely on completed turns, so the game can stall once the AI switches to mini-games.

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

### 6. SlideToUnlock is unused

- Severity: Low
- Location: `components/SlideToUnlock.tsx`

The slide-to-unlock control is not used in `/play`. The pass screen uses a button instead.
