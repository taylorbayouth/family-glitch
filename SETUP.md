# Setup and Roster Flow

This document describes the current player setup flow and the related navigation/menu behavior.

## What Exists Today

### 1. Hamburger Menu

File: `components/HamburgerMenu.tsx`

- Only renders when a NextAuth session exists.
- Fixed button in the top-right with slide-in panel.
- Menu items:
  - How to Play modal
  - Start a New Game (calls `useGameStore().startNewGame()`, keeps players)
  - Log Out (NextAuth signOut)
- Uses Framer Motion for transitions and the glassmorphism theme.

### 2. Player Store

File: `lib/store/player-store.ts`

- localStorage key: `family-glitch-players`
- Player fields: `id`, `name`, `role`, `age`, `avatar`
- `hasHydrated` flag set on rehydrate
- Avatars are PNGs `public/avatars/1.png` through `public/avatars/14.png`

### 3. Game Store and Start New Game

File: `lib/store/game-store.ts`

- `startNewGame()` resets the current game session but keeps the player roster intact.
- `resetGame()` wipes the game session and the legacy `players` list.

### 4. Setup Page

File: `app/setup/page.tsx`

- Requires hydration before rendering (`useHydration`).
- Creates 3 default player forms if the store is empty.
- Supports 3 to 7 players.
- Each player form collects:
  - Name (required)
  - Role (13 options)
  - Age (1 to 120, required)
  - Avatar (1 to 14 PNG image options)
- Form validation expands the first invalid player.
- On Continue:
  - Updates existing players or adds new ones
  - Removes players that were deleted in the UI
  - Navigates to `/play`

## Data Persistence

Two localStorage keys are used:

- `family-glitch-players` -> Player roster (persistent)
- `family-glitch-game` -> Game session (resettable)

## User Flow Summary

1. User signs in -> `/setup`
2. Configure players (3 to 7)
3. Continue -> `/play`
4. Hamburger Menu is available during authenticated pages

## Notes

- The setup screen uses expandable player cards, avatar image previews, and inline validation.
- The roster persists across sessions unless players are manually removed.
