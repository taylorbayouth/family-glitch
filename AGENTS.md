# AGENTS.md

AI agent context for the Family Glitch project.

## Project Overview

Family Glitch is a pass-and-play party game where a snarky AI host runs short turns, asks questions with dynamic input templates, and occasionally triggers mini-games. The app is built with Next.js 15, GPT-5.2 tool calling, and Google OAuth (NextAuth).

Live Site: https://family-glitch.vercel.app
Repository: https://github.com/taylorbayouth/family-glitch

## Tech Stack

- Framework: Next.js 15.1.3 (App Router)
- Language: TypeScript 5.7.2
- Runtime: React 19.0.0
- AI: OpenAI SDK 4.77.3 (GPT-5.2)
- Auth: NextAuth.js 5.0.0-beta.25
- State: Zustand 5.0.10 (persist middleware)
- Styling: Tailwind CSS 4.1.18 (CSS-based config)
- Animations: Framer Motion 12.27.1
- Package manager: npm

## App Routes and Flow

- `/` Home page with Google sign-in CTA. If a session exists, the client redirects to `/setup`.
- `/auth/signin` Custom sign-in page using a server action (`signIn('google')`).
- `/setup` Player roster setup (3 to 7 players). Saves to `usePlayerStore`.
- `/play` Main game flow (pass screen -> question or mini-game -> commentary -> next player).
- `/chat` AI chat demo page for testing `/api/chat`.

## Game Flow (Current Implementation)

1. Setup players in `/setup` (name, role, age, avatar image).
2. `/play` loads, starts the game (if `gameId` is empty), and preloads a question during the pass screen.
3. Player taps the pass screen button to reveal their question or mini-game.
4. For normal questions, a template component renders and submits a structured response.
5. The app requests short AI commentary (toolChoice: `none`) and shows a manual "Pass to {next}" button.
6. Game ends when `useGameStore().isGameComplete()` returns true, then `/play` shows `EndGameResults` which calls `/api/announcer` for rankings.

Notes:
- The pass screen uses a large button, not the `SlideToUnlock` component. `SlideToUnlock` exists but is not wired into `/play`.
- Both regular questions and mini-games create `Turn` entries in the game store for proper progress tracking.
- Scores from mini-games are applied to the player's total via `updatePlayerScore()`.
- All AI prompts include defensive null checks to prevent generation failures.

## Project Structure (Key Paths)

```
app/
  api/
    announcer/route.ts          # End-game announcer API
    auth/[...nextauth]/route.ts # NextAuth handlers
    chat/route.ts               # GPT-5.2 chat API with tools
    health/route.ts             # Health check
  auth/signin/page.tsx          # Custom sign-in page
  chat/page.tsx                 # AI demo page
  layout.tsx                    # Root layout with SessionProvider + HamburgerMenu
  page.tsx                      # Home page (CTA + redirect if session)
  play/page.tsx                 # Main game flow
  setup/page.tsx                # Player setup

components/
  GameHeader.tsx                # Leaderboard + progress bar
  GameProgressBar.tsx           # Acts + progress
  Leaderboard.tsx               # Score list
  EndGameResults.tsx            # Announcer-driven results
  HamburgerMenu.tsx             # Auth-only menu and modals
  PassToPlayerScreen.tsx        # Pass screen
  SlideToUnlock.tsx             # Unused slide interaction
  SessionProvider.tsx           # NextAuth provider
  input-templates/              # 6 input templates + registry
  mini-games/                   # Mini-game UIs
  ui/                           # Button/Input/Card components

lib/
  ai/
    client.ts                   # sendChatRequest + useChat hook
    config.ts                   # Defaults + model config
    tools.ts                    # Tool registry (lazy loads template tools)
    template-tools.ts           # Input template tools + mini-game triggers
    game-master-prompt.ts       # Game Master system prompt
    announcer-prompt.ts         # Announcer prompt
    types.ts                    # AI types
  mini-games/                   # Registry, prompts, eligibility
  store/                        # Zustand stores
  types/                        # Game state and announcer types
  constants.ts                  # Game and app constants

public/avatars/                 # Avatar PNGs (1.png to 14.png)
```

## AI System

### Chat API (`/api/chat`)

- Uses `openai.chat.completions.create()`.
- Implements a tool execution loop.
- Template tools return immediately as JSON (stringified in the `text` field).
- For non-template tools, tool results are appended and the loop continues.
- `GET /api/chat` returns the list of tool names.

### Tool Registry

- Defined in `lib/ai/tools.ts` with a `ToolRegistry` singleton.
- Template tools are lazy-loaded via `ensureTemplateToolsLoaded()` to avoid circular imports.

### Template Tools (Input Templates)

Tools in `lib/ai/template-tools.ts`:
- `ask_for_text` -> `tpl_text_area`
- `ask_for_list` -> `tpl_text_input`
- `ask_binary_choice` -> `tpl_timed_binary`
- `ask_word_selection` -> `tpl_word_grid`
- `ask_rating` -> `tpl_slider`
- `ask_player_vote` -> `tpl_player_selector`

### Mini-Game Triggers

Template tools that start mini-games:
- `trigger_trivia_challenge`
- `trigger_personality_match`
- `trigger_madlibs_challenge`
- `trigger_cryptic_connection`
- `trigger_hard_trivia`

### Game Master Prompt

`buildGameMasterPrompt()` injects:
- Player roster and scores
- Recent turns (last 5) to avoid repeated topics
- Act logic (Act 1 questions, Act 2+ mini-games)
- Rules for short, single-question prompts and brief commentary

### Announcer Prompt

`buildAnnouncerPrompt()` summarizes all turns and scores, then requests a JSON results payload from GPT-5.2. This powers `/api/announcer` and the `EndGameResults` reveal sequence.

## Input Templates

All templates are in `components/input-templates/` with a registry in `components/input-templates/index.tsx`.

Templates:
- `tpl_text_area` (TextAreaTemplate)
- `tpl_text_input` (TextInputTemplate)
- `tpl_timed_binary` (TimedBinaryTemplate)
- `tpl_word_grid` (WordGridTemplate, supports 4/9/16/25)
- `tpl_slider` (SliderTemplate)
- `tpl_player_selector` (PlayerSelectorTemplate)

Notes:
- `TemplateRenderer` injects player data for `tpl_player_selector` in `/play`.
- `validateTemplateParams` exists but is not called in `/play`.

## Mini-Games

Mini-games are registered in `lib/mini-games/*/register.ts` and discovered via the registry in `lib/mini-games/registry.ts`.

Available mini-games:
- Trivia Challenge
- Personality Match
- Mad Libs Challenge
- Cryptic Connection
- Hard Trivia

Eligibility rules live in `lib/mini-games/eligibility.ts`. `/play` currently uses `getEligibleTurnsForPlayer()` to pass trivia eligibility data into the prompt.

## State Management

### Player Store (`lib/store/player-store.ts`)

- localStorage key: `family-glitch-players`
- Fields: `id`, `name`, `role`, `age`, `avatar`
- `hasHydrated` flag + `setHasHydrated()` for hydration tracking
- Avatars in the UI are PNGs `1.png` to `14.png` in `public/avatars`

### Game Store (`lib/store/game-store.ts`)

- localStorage key: `family-glitch-game`
- New state shape (turn-based):
  - `gameId`, `startedAt`, `endedAt`, `turns`, `currentTurnIndex`, `status`, `scores`, `settings`
- Legacy fields retained: `players`, `currentRound`, `gameStarted`
- Actions:
  - `addTurn()` returns the generated turnId
  - `completeTurn()`, `updateTurnResponse()`, `skipTurn()`
  - `updatePlayerScore()`
  - `startGame()`, `startNewGame()` (keeps players), `resetGame()` (clears players)
- Computed helpers:
  - `getTotalRounds()` uses `calculateTotalRounds(players.length)`
  - `getCurrentRound()`, `getCurrentAct()`, `getProgressPercentage()`
  - `isGameComplete()`

## Authentication

- NextAuth v5 with Google OAuth.
- Custom sign-in page at `/auth/signin`.
- Root layout wraps the app with `SessionProvider`.
- `HamburgerMenu` only renders when `useSession()` has a user session.

## Styling and Design System

- Tailwind v4 config is in `app/globals.css` (`@theme`).
- `tailwind.config.ts` is present for reference only and is not used.

Theme tokens include:
- Colors: `void`, `void-light`, `void-dark`, `glitch`, `glitch-bright`, `glitch-deep`, `frost`, `mint`, `alert`, `steel-100` through `steel-900`
- Fonts: `Inter` and `JetBrains Mono`
- Radius: `--radius-control` (12px), `--radius-card` (16px), `--radius-pill`
- Shadows: `--shadow-glow`, `--shadow-glow-strong`, `--shadow-glow-mint`

Custom classes in `app/globals.css`:
- `.glass`, `.scan-line`, `.glitch-text`, `.bg-grid-pattern`, `.noise-overlay`
- Utility helpers: `.tap-shrink`, `.text-glow`, `.custom-scrollbar`

## UI Components

- `components/ui/Button.tsx` with variants: primary, secondary, ghost, danger
- `components/ui/Input.tsx` with label and error states
- `components/ui/Card.tsx` with default/glass/void variants

Some pages still use inline styles:
- `/auth/signin`
- `/chat`

## API Endpoints

- `POST /api/chat` Chat completions with tool execution loop
- `GET /api/chat` Tool list + model info
- `GET /api/health` Runtime diagnostics
- `POST /api/announcer` End-game results (JSON)
- `GET /api/announcer` Health check
- `GET/POST /api/auth/[...nextauth]` NextAuth handlers

## Environment Variables

Required:
- `OPENAI_API_KEY`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `NEXTAUTH_URL`

## Commands

```bash
npm install
npm run dev
npm run build
npm start
```

## Files That Are Intentionally Empty or Legacy

- `lib/store/facts-store.ts` is intentionally empty (turns are the source of truth).
- `tailwind.config.ts` is deprecated in Tailwind v4.

## Recent Fixes (v1.1.1)

### Critical Bug Fixes
1. **React Hooks Violation**: Moved `useState` call out of conditional error render block in `/play` to comply with Rules of Hooks.
2. **Hard Trivia Props Mismatch**: Renamed `currentPlayer` to `targetPlayer` in `HardTriviaUI` to match mini-game convention. Added `turns` prop to all mini-game renders.
3. **Mini-game Progress Tracking**: Mini-games now create turn entries via `addTurn()` and complete them with results, fixing game progression stalls in Act 2+.
4. **Score Application**: `handleMiniGameComplete()` now properly calls `updatePlayerScore()` to apply mini-game scores to the leaderboard.
5. **Play Again Reset**: End-game "Play Again" now calls `resetGame()` before routing to setup, clearing stale state.

### AI Prompt Improvements
- All mini-game prompt builders (`trivia-challenge`, `cryptic-connection`, `madlibs-challenge`, `personality-match`, `hard-trivia`) now include comprehensive null safety checks.
- Defensive patterns: `const safeName = object?.name || 'Default'` and `const safeArray = (array || []).filter(p => p && p.name)`.
- Prevents "undefined is not an object" errors during AI generation.

### UI/UX Improvements
- Removed vertical scrolling from all input templates by replacing vertical centering with top-aligned flex layouts.
- Increased leaderboard player tile spacing (6px → 12px).
- Made progress bar taller (12px → 20px) with more vibrant colors and stronger glow.
- Reduced margin under game header to eliminate gap between header and content.
- Reduced top padding on all template content areas (16px → 4px).

## Testing

No test runner is configured yet. There are no automated tests in the repo.
