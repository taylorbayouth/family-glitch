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

## Recent Changes (v1.1.3 - 2026-01-21)

### AI Prompt Philosophy Shift
Changed from restriction-heavy prompts to goal-focused prompts:
- **Before**: Long lists of what NOT to do → bloated, confusing
- **After**: Clear goals of what TO accomplish → concise, effective

### Game Master Prompt Rewrite
- Removed "family-friendly" language causing overly cautious questions
- Treat 10+ year-olds as pre-teens/teens, not young children
- Expanded Act 1 examples: passions, skills, entertainment, local flavor, binary debates, interest grids
- Added explicit rule: "Avoid memory-check questions in Act 1 (answers are secret)"
- Reduced from ~200 lines to ~80 lines

### Trivia Challenge Improvements
- Fixed "ordinal problem": AI was asking "What was the SECOND thing?" (impossible to answer)
- Added guidance: "Ask about MEMORABLE or DISTINCTIVE parts, not list order"

### Mad Libs Enhancement
- Changed to exactly 2 blanks per template (was variable)
- Added Cards Against Humanity energy with witty templates
- Goal shifted to "Make players feel WITTY, not just shocking"
- 8 strong example templates that reward cleverness over crude answers

### Mini-Game Eligibility Relaxed
- Removed artificial `>= 3 turns` constraint
- Now available with just 1 eligible turn from another player
- Rationale: Act 1 already collects data, constraint was redundant

### Timed Binary UX Fixes
- Added "Neither" button as third option below main choices
- Fixed pre-selection bug (first button appeared selected on load)
- Added `focus:outline-none` and blur-on-mount to prevent auto-focus

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

### 3-Act Structure

The game divides into acts based on progress (calculated in `lib/constants.ts`):

**Act 1 (0-33% of rounds)**: Data Collection
- AI asks questions using input templates to learn about each player
- Questions reveal interests, skills, preferences, stories, local knowledge
- **Critical constraint**: Questions must NOT test memory of other players' answers (those are secret until Act 2)
- Examples: "What could you talk about for hours?" "Beatles or Stones?" "Favorite YouTuber?"
- Goal: Build knowledge database for mini-games in Acts 2-3

**Act 2 (33-66%)**: Mini-Games Unlocked (Trivia, Personality Match, Hard Trivia)
- AI switches from questions to mini-games that test family knowledge
- Eligibility: At least 1 completed turn from another player
- Games reference Act 1 answers to create personalized challenges

**Act 3 (66-100%)**: All Mini-Games Available
- All 6 mini-games unlocked: + Mad Libs, Cryptic Connection, The Filter
- More challenging games appear as the knowledge base grows

### Mini-Game Handoff Process

When AI returns a mini-game template type (e.g., `trivia_challenge`):

1. `/play` detects `isMiniGame(templateType)` → true
2. Loads registry config from `lib/mini-games/registry.ts`
3. Calls `extractConfig()` to build game-specific props from AI tool params
4. Renders mini-game UI component (e.g., `TriviaChallengeUI`)
5. Mini-game owns:
   - Its own AI calls (generation + scoring)
   - User interaction
   - Turn creation via `addTurn()`
   - Score calculation (0-5 points)
6. On completion: `onComplete(MiniGameResult)`
7. `/play` calls `updatePlayerScore()` and shows commentary

All mini-games follow a **2-turn AI pattern**:
- Turn 1: Generate puzzle/question
- Turn 2: Score the player's response

### Implementation Notes

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
- `trigger_hard_trivia`
- `trigger_personality_match`
- `trigger_madlibs_challenge`
- `trigger_cryptic_connection`
- `trigger_the_filter`

### Game Master Prompt

`buildGameMasterPrompt()` in `lib/ai/game-master-prompt.ts` injects:
- Player roster with ages, roles, and current player indicator
- Score leaderboard (if any scores exist)
- Recent turns (last 8) to avoid repeated questions
- Act-specific mission and available games
- Eligible trivia turns (if any) with player IDs for `trigger_personality_match`

**Act 1 mission**: Ask ONE question per turn to learn about family interests, skills, preferences
**Act 2+ mission**: Run ONE mini-game per turn, picking games that fit player age and interests

Key rules in prompt:
- ONE question or mini-game per turn
- NEVER repeat a question that's been asked before
- Keep questions short (under 20 words)
- Match content to the player's age and world
- Be witty - one-liner commentary only (max 10 words)
- In Act 1: Avoid memory-check questions (answers are secret)

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

### Available Mini-Games (6 total)

1. **Trivia Challenge** (glitch/purple theme)
   - Type: `trivia_challenge`
   - Trigger: `trigger_trivia_challenge`
   - Uses a past turn from another player
   - AI asks a question about what that player said
   - Scores 0-5 based on answer accuracy
   - Eligibility: ≥1 completed turn from another player

2. **Hard Trivia** (cyan theme)
   - Type: `hard_trivia`
   - Trigger: `trigger_hard_trivia`
   - Multiple-choice trivia based on player's stated interests
   - Scores 0-5 based on correctness
   - No special eligibility (always available in Acts 2+)

3. **Personality Match** (mint theme)
   - Type: `personality_match`
   - Trigger: `trigger_personality_match` (requires `subjectPlayerId`)
   - Player describes a family member using word grid
   - AI scores based on past turns about that person
   - Eligibility: ≥1 completed turn from another player

4. **Mad Libs Challenge** (amber theme)
   - Type: `madlibs_challenge`
   - Trigger: `trigger_madlibs_challenge`
   - Fill-in-the-blank with 2 blanks, each with a starting letter
   - Scores 0-5 based on creativity and wit
   - No special eligibility (always available in Act 3+)

5. **Cryptic Connection** (violet theme)
   - Type: `cryptic_connection`
   - Trigger: `trigger_cryptic_connection`
   - 5×5 word grid, find the mystery connecting word
   - Scores 0-5 with fuzzy AI matching
   - No special eligibility (always available in Act 3+)

6. **The Filter** (teal theme)
   - Type: `the_filter`
   - Trigger: `trigger_the_filter`
   - Grid-based selection game with pattern recognition
   - Select items that match a secret rule
   - Scores 0-5 based on selections
   - No special eligibility (always available in Act 3+)

### Mini-Game Architecture

**Registry pattern**: Each game has:
- `register.ts` - Registers with central registry
- `prompt.ts` - AI prompts for generation and scoring
- Component in `components/mini-games/` - UI and game logic

**2-turn AI pattern** (all mini-games follow this):
1. **Generation turn**: AI creates puzzle/question content
2. **Scoring turn**: AI evaluates player's response and assigns 0-5 points

**Config extraction**: Registry's `extractConfig()` validates AI params and builds game-specific props

**Turn tracking**: Mini-games call `addTurn()` themselves for proper game progression

### Eligibility System

`lib/mini-games/eligibility.ts` provides:
- `getEligibleTurnsForPlayer(turns, currentPlayerId)` - Returns completed turns from other players
- Used by `/play` to build `triviaEligibleTurns` for Game Master prompt
- Used by `trivia-challenge/register.ts` and `personality-match/register.ts` for config extraction

**Current eligibility requirements** (as of v1.1.3):
- Trivia Challenge: ≥1 eligible turn
- Personality Match: ≥1 eligible turn
- All others: No requirements (always available in their unlocked act)

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

## Common Pitfalls and Debugging

### Act Boundaries
- Acts are calculated as 33%/66% splits, NOT 25%/75%
- Calculated in `lib/constants.ts` by `calculateCurrentAct()`
- Must match `GameProgressBar.tsx` divider positions

### Mini-Game Eligibility
- Don't add artificial turn count requirements (e.g., `>= 3`)
- Act 1 already collects data - just need ≥1 eligible turn
- Trivia/Personality Match require eligible turns; others don't

### AI Prompt Design
- **Goal-focused** beats restriction-heavy
- Show examples of what you WANT, not endless lists of what NOT to do
- Keep prompts concise - long prompts confuse the AI
- Treat 10+ year-olds as pre-teens/teens, not young kids

### Turn Creation
- Both regular questions AND mini-games must call `addTurn()`
- Without turn creation, game progress stalls
- Mini-games should call `addTurn()` during generation phase

### Score Application
- Mini-games return `MiniGameResult` with score
- `/play` must call `updatePlayerScore()` to apply it
- Don't forget this step or scores won't update

### Template Type Mismatches
- Always check if template type is in registry before rendering
- Use `isMiniGame(templateType)` to detect mini-games
- Use `getTemplateComponent(templateType)` for regular templates

### Defensive Coding
- All AI prompt builders should have null checks
- Use patterns like: `const safeName = player?.name || 'Player'`
- Filter arrays defensively: `(arr || []).filter(x => x && x.property)`

### AI Context Requirements ⚠️ CRITICAL

**MANDATORY RULE: Always send FULL game state to AI prompts when context is needed.**

Modern AI models (GPT-5.2, Claude Sonnet, etc.) have massive context windows (200K+ tokens). There is NO need to artificially limit the data we send. Limiting context causes critical bugs like:
- Question repetition (AI "forgets" old questions and repeats them)
- Poor personalization (AI can't see full player history)
- Inconsistent mini-game scoring (AI lacks complete context)

**DO NOT use `.slice(-N)` to limit context unless you have a specific, documented reason.**

**Examples of what to send:**
- ✅ All game turns (`gameState.turns.map(...)`) - NOT `.slice(-8)`
- ✅ All player turns (`playerTurns.map(...)`) - NOT `.slice(-5)`
- ✅ Full conversation history
- ✅ Complete player profiles

**Previous bugs caused by artificial limits:**
- `gameState.turns.slice(-8)` caused question repetition after 8+ turns (FIXED in v1.1.4)
- `playerTurns.slice(-5)` in Hard Trivia limited personalization (FIXED in v1.1.4)
- `safeTurns.slice(-5)` in Personality Match limited accuracy (FIXED in v1.1.4)

**When to limit context (rare cases):**
- User-facing UI displays (e.g., "Show last 5 messages")
- Performance-critical real-time updates
- Explicit user preferences

**Cost is not a concern:** The benefit of full context far outweighs token costs. A better AI experience is worth the extra ~$0.01 per game.

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

## Recent Updates

### v1.2.0 - Code Quality & Accessibility Refactor

**Shared Component Library**:
- Created 5 shared mini-game components: `LoadingSpinner`, `ScoreDisplay`, `CommentaryCard`, `ErrorToast`, `IntroScreen`
- Extracted common utilities to `lib/mini-games/utils.ts` (JSON parsing, score colors, null safety helpers)
- Centralized game themes in `lib/mini-games/themes.ts` with unique color schemes for each game

**TypeScript Improvements**:
- Added `'the_filter'` to `MiniGameType` union for complete type coverage
- Fixed all 6 register files to use proper `ComponentType<BaseMiniGameProps>` instead of `as any` casts
- Added `TheFilterUI` to barrel exports in `components/mini-games/index.ts`
- Removed unused exports: `isTriviaEligible()` and `createTriviaChallengeSession()`

**Code Quality**:
- Extracted magic numbers to named constants (`TURN_SELECTION_WEIGHTS`, `CRYPTIC_GRID_SIZE`)
- Reduced code duplication by ~40% through shared components
- Standardized border radius (`rounded-xl`) across all grid items

**Accessibility**:
- Added ARIA labels to all shared components (`role="status"`, `aria-label`, `aria-live="polite"`)
- Fixed z-index conflicts in error toasts (`z-[60]` to appear above intro screens)
- Improved responsive grid layouts (mobile: 3 cols → tablet: 4 cols → desktop: 5 cols)

**Documentation**:
- Updated all *.md files to reflect v1.1.1 fixes and v1.2.0 changes
- Created CHANGELOG.md for version history
- Added shared component documentation to lib/mini-games/README.md

### v1.1.1 - Critical Bug Fixes

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

## Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history. See [ROADMAP.md](ROADMAP.md) for planned features.

### v1.1.3 - AI Prompt Improvements & UX Fixes (2026-01-21)

**AI Prompt Philosophy Shift**: Changed from restriction-heavy to goal-focused prompts.

**Game Master Prompt Rewrite**:
- Removed "family-friendly" language causing overly cautious questions
- Treat 10+ year-olds as pre-teens/teens, not young children
- Expanded Act 1 examples: passions, skills, entertainment, local flavor, binary debates, interest grids
- Added explicit rule: "Avoid memory-check questions in Act 1 (answers are secret)"
- Reduced from ~200 lines to ~80 lines

**Trivia Challenge**: Fixed ordinal problem (AI asking "What was the SECOND thing?")
**Mad Libs**: Exactly 2 blanks, Cards Against Humanity energy, focus on wit
**Mini-Game Eligibility**: Removed `>= 3 turns` constraint (now just ≥1 eligible turn)
**Timed Binary**: Added "Neither" button, fixed pre-selection bug

### v1.1.1 - Critical Bug Fixes (2026-01-18)

**Critical Fixes**:
- React Hooks violation in `/play`
- Hard Trivia props mismatch (`currentPlayer` → `targetPlayer`)
- Mini-games now create turn entries for proper progression
- Score application via `updatePlayerScore()`
- Play Again reset clears stale state

**AI Prompts**: Comprehensive null safety checks in all mini-game prompt builders
**UI/UX**: Removed scrolling, improved spacing, vibrant progress bar

### v1.1.0 - Feature Additions (2026-01-15)

- Fixed game header with leaderboard and progress bar
- Hard Trivia mini-game
- The Filter mini-game
- 0-5 scoring standardization
- Mini-games only in Acts 2-3
- Announcer API uses GPT-5.2

### v1.0.0 - Initial Release (2026-01-10)

- Next.js 15 + React 19 + TypeScript
- Google OAuth via NextAuth v5
- GPT-5.2 chat completions with tool execution
- 6 input templates
- 4 mini-games (Trivia, Personality Match, Mad Libs, Cryptic Connection)
- 3-act game structure
- Pass-and-play gameplay
