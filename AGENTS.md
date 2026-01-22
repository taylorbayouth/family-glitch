# AGENTS.md

AI agent context for the Family Glitch project.

## Project Overview

Family Glitch is a pass-and-play party game where a snarky AI host runs short turns, asks questions with dynamic input templates, and triggers mini-games. Built with Next.js 15, GPT-5.2 tool calling, and Google OAuth (NextAuth).

Live Site: https://family-glitch.vercel.app
Repository: https://github.com/taylorbayouth/family-glitch
Version: 1.1.5

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

## Recent Changes (v1.1.5 - 2026-01-22)

### Critical Bug Fixes

**Act Boundary Consistency** ([constants.ts:84](lib/constants.ts#L84))
- Fixed fractional vs floor boundary mismatch between `calculateCurrentAct` and `getPendingTransitionEvent`
- Changed from `progress < 1/3` to `currentRound < Math.floor(totalRounds/3)`
- Eliminates bug where "Act 1 Complete" showed but currentAct was still 1
- Insights now inject at correct moment

**Consecutive Turns After Transitions** ([page.tsx:357](app/play/page.tsx#L357))
- Fixed same player getting back-to-back turns across Act boundaries
- After transition completes, now advances `currentPlayerIndex` and `turnNumber` before loading next question
- Ensures fair turn distribution

**Trivia Eligibility Gate** ([page.tsx:151](app/play/page.tsx#L151))
- Changed eligibility requirement from `≥ 3` to `≥ 1` turns
- Unlocks Trivia Challenge and Personality Match earlier in Act 2
- Improves mini-game variety in small/early games

**The Filter Visibility** ([game-master-prompt.ts:107](lib/ai/game-master-prompt.ts#L107))
- The Filter now visible in Act 2+ block (was Act 3+ only)
- AI can select it starting in Act 2 as intended
- Mad Libs and Cryptic Connection remain Act 3+ exclusive

### Code Cleanup

- Removed unused `getActBoundaries()` function from constants and game-store
- Removed unused `nextRound()` method from game-store
- Removed unused `addPlayer()` and `removePlayer()` methods from game-store (player-store handles this)
- Removed redundant `currentAct` filter in `formatAllTransitionResponses()` - events can only be complete after advancing to next act
- Removed `currentRound` and `gameStarted` field assignments (calculated from turns instead)

## App Routes and Flow

- `/` Home page with Google sign-in CTA. If session exists, redirects to `/setup`.
- `/auth/signin` Custom sign-in page using server action `signIn('google')`.
- `/setup` Player roster setup (2 to 7 players). Saves to `usePlayerStore`.
- `/play` Main game flow (pass screen → question/mini-game → commentary → next player).
- `/chat` AI chat demo page for testing `/api/chat`.

## Game Flow

1. Setup players in `/setup` (name, role, age, avatar).
2. `/play` starts game and preloads question during pass screen.
3. Player taps to reveal their question or mini-game.
4. Template component renders and submits structured response.
5. AI provides short commentary (`toolChoice: none`).
6. Manual "Pass to {next}" button advances to next player.
7. Game ends when `isGameComplete()` returns true.
8. `EndGameResults` calls `/api/announcer` for final rankings.

### 3-Act Structure

Acts are based on completed turns (calculated in [constants.ts:84](lib/constants.ts#L84)):
- Act 1 ends at `Math.floor(totalRounds / 3)`
- Act 2 ends at `Math.floor(totalRounds * 2 / 3)`
- Act 3 ends at `totalRounds`

**Act 1 (0 to floor(1/3) turns): SECRET INTEL GATHERING 🤫**
- **PRIVATE PHASE** - Each player answers alone
- AI asks questions using input templates
- Questions reveal interests, skills, preferences, local knowledge
- **NO MINI-GAMES** - Only input templates
- NO memory-check questions (answers are secret until Act 2)
- Goal: Build knowledge database for mini-games
- **After Act 1 completes**: Transition event collects insights from all players

**Act 2 (floor(1/3) to floor(2/3) turns): PUBLIC MINI-GAMES BEGIN 📱**
- **PUBLIC PHASE** - Phone in center, everyone watches
- AI switches from questions to mini-games
- **4 mini-games unlock:**
  1. **Trivia Challenge** - Guess what someone would say (requires ≥1 turn from others)
  2. **Personality Match** - Describe family member with words (requires ≥1 turn from others)
  3. **Hard Trivia** - Custom trivia based on interests (standalone)
  4. **The Filter** - Pattern recognition game (standalone)
- Games reference Act 1 answers for personalization

**Act 3 (floor(2/3) to totalRounds turns): ADVANCED GAMES UNLOCK 🎮**
- All Act 2 mini-games remain available
- **3 additional games unlock:**
  1. **Mad Libs Challenge** - Fill-in-the-blank wordplay (2 blanks, Cards Against Humanity energy)
  2. **Cryptic Connection** - Find hidden connection in 5×5 word grid
  3. **Lighting Round** - 5 rapid-fire timed binary questions (+5 right, -5 wrong, Pass allowed)
- **All 7 mini-games** available

### Act Transition Events

**System**: Declarative event registry in [lib/act-transitions/index.ts](lib/act-transitions/index.ts)

**Act 1 → Act 2 Transition** (ACT1_INSIGHTS):
1. After Act 1's final turn completes, `getPendingTransitionEvent()` detects the event
2. Game pauses normal flow and enters transition mode
3. Each player answers a personalized insight question (interests, learning, family facts, secrets, focus)
4. Questions use age-appropriate variants (kid/teen/adult)
5. Responses are saved to `transitionResponses` array
6. Event marked complete when all players finish
7. Game advances to next player and resumes normal Act 2 gameplay

**Insight Injection**: After event completes, `formatAllTransitionResponses()` formats responses into markdown and injects them into the Game Master prompt for Acts 2-3.

### Mini-Game Architecture

**Registry Pattern**: Each game has:
- `register.ts` - Registers with central registry
- `prompt.ts` - AI prompts for generation and scoring
- Component in `components/mini-games/` - UI and game logic

**2-Turn AI Pattern** (most mini-games follow this):
1. **Generation turn**: AI creates puzzle/question content
2. **Scoring turn**: AI evaluates response and assigns 0-5 points

**Turn Tracking**: Mini-games call `addTurn()` themselves for proper game progression.

**Lighting Round exception**: Uses repeated single-turn generation (5 questions) with local scoring (+5/-5/0).

**Available Mini-Games** (7 total):

| Game | Act | Requires Data | Theme |
|------|-----|---------------|-------|
| Trivia Challenge | 2+ | Other players' turns | 💜 Purple |
| Personality Match | 2+ | Other players' turns | 💚 Mint |
| Hard Trivia | 2+ | Player's own interests | 🩵 Cyan |
| The Filter | 2+ | None (standalone) | 🩵 Teal |
| Mad Libs | 3 | None (standalone) | 🧡 Amber |
| Cryptic Connection | 3 | None (standalone) | 💜 Violet |
| Lighting Round | 3 | Other players' turns | ⚡ Glitch |

**Eligibility**: [lib/mini-games/eligibility.ts](lib/mini-games/eligibility.ts)
- `getEligibleTurnsForPlayer(turns, currentPlayerId)` returns completed turns from other players
- Trivia Challenge, Personality Match, and Lighting Round require ≥1 eligible turn
- All others: No requirements (available in their unlocked act)

## Project Structure (Key Paths)

```
app/
  api/
    announcer/route.ts          # End-game announcer
    auth/[...nextauth]/route.ts # NextAuth handlers
    chat/route.ts               # GPT-5.2 with tools
    health/route.ts             # Health check
  auth/signin/page.tsx          # Sign-in page
  chat/page.tsx                 # AI demo
  layout.tsx                    # SessionProvider + HamburgerMenu
  page.tsx                      # Home
  play/page.tsx                 # Main game
  setup/page.tsx                # Player setup

components/
  GameHeader.tsx                # Leaderboard + progress
  GameProgressBar.tsx           # Acts + progress
  Leaderboard.tsx               # Score list
  EndGameResults.tsx            # Announcer results
  HamburgerMenu.tsx             # Auth menu
  PassToPlayerScreen.tsx        # Pass screen
  SessionProvider.tsx           # NextAuth provider
  input-templates/              # 6 input templates + registry
  mini-games/                   # Mini-game UIs + shared components
  ui/                           # Button/Input/Card

lib/
  act-transitions/              # Transition event system
    index.ts                    # Event registry + formatting
  ai/
    client.ts                   # sendChatRequest + useChat hook
    config.ts                   # Defaults + model config
    tools.ts                    # Tool registry
    template-tools.ts           # Input template tools + mini-game triggers
    game-master-prompt.ts       # Dynamic Game Master prompt builder
    announcer-prompt.ts         # End-game announcer prompt
    sanitize.ts                 # Sanitize responses for AI context
    types.ts                    # AI types
  mini-games/                   # Registry, prompts, eligibility, themes, utils
  store/
    player-store.ts             # Player roster (persisted)
    game-store.ts               # Game state (persisted)
  types/                        # Game state and announcer types
  constants.ts                  # Game and app constants
```

## AI System

### Chat API (`/api/chat`)

- Uses `openai.chat.completions.create()`
- Implements tool execution loop
- Template tools return immediately as JSON (stringified in `text` field)
- Tool results appended for non-template tools, loop continues
- `GET /api/chat` returns tool list and model info

### Tool Registry

- [lib/ai/tools.ts](lib/ai/tools.ts) - `ToolRegistry` singleton
- Template tools lazy-loaded via `ensureTemplateToolsLoaded()`
- Prevents circular imports

### Template Tools (Input Templates)

**Tools in [lib/ai/template-tools.ts](lib/ai/template-tools.ts)**:
- `ask_for_text` → `tpl_text_area`
- `ask_for_list` → `tpl_text_input`
- `ask_binary_choice` → `tpl_timed_binary`
- `ask_word_selection` → `tpl_word_grid`
- `ask_rating` → `tpl_slider`
- `ask_player_vote` → `tpl_player_selector`

**Mini-Game Triggers**:
- `trigger_trivia_challenge`
- `trigger_hard_trivia`
- `trigger_personality_match`
- `trigger_madlibs_challenge`
- `trigger_cryptic_connection`
- `trigger_the_filter`
- `trigger_lighting_round`

### Game Master Prompt

**[buildGameMasterPrompt()](lib/ai/game-master-prompt.ts) dynamically injects**:
- Current act and mission (Act 1: questions, Act 2+: mini-games)
- Available mini-games based on current act
- Player roster with ages, roles, current player indicator
- Score leaderboard (if any scores exist)
- Full turn history (DO NOT use `.slice()` - send all turns)
- Transition event responses (insights from Act 1)
- Eligible trivia turns with player IDs

**Act-specific instructions**:
- **Act 1**: Ask questions to learn about players (secret answers)
- **Act 2+**: Run mini-games that test family knowledge (public phase)

**Key rules**:
- ONE question or mini-game per turn
- NEVER repeat questions
- Keep questions short (under 20 words)
- Match content to player's age
- Witty one-liner commentary only (max 10 words)
- In Act 1: Avoid memory-check questions (answers are secret)

### Dynamic Prompt System

**Rebuilds system prompt every turn** with fresh context:

1. Calculate current act from completed turns
2. Format transition responses (insights from completed events)
3. Build act-specific instructions and available games
4. Inject player roster and scores
5. Include full turn history for context
6. Replace old system message with new one
7. Send to AI with act-appropriate tools

**Why this works**:
- State-aware: AI sees different instructions/tools based on progress
- Context-rich: Full history, insights, scores in every turn
- No stale data: Perfect context regenerated each turn
- Act progression: Behavior changes automatically as game advances

## State Management

### Player Store ([lib/store/player-store.ts](lib/store/player-store.ts))

- localStorage key: `family-glitch-players`
- Fields: `id`, `name`, `role`, `age`, `avatar`
- `hasHydrated` flag for hydration tracking
- Avatars: `1.png` to `14.png` in `public/avatars`

### Game Store ([lib/store/game-store.ts](lib/store/game-store.ts))

- localStorage key: `family-glitch-game`
- State: `gameId`, `startedAt`, `endedAt`, `turns`, `currentTurnIndex`, `status`, `scores`, `settings`
- Transition state: `transitionResponses`, `transitionEvents`
- Legacy field retained: `players` (for backwards compatibility in `getPlayerCount`)

**Actions**:
- `addTurn()` returns generated turnId
- `completeTurn()`, `updateTurnResponse()`, `skipTurn()`
- `updatePlayerScore()`
- `startGame()`, `startNewGame()`, `resetGame()`
- `addTransitionResponse()`, `markTransitionEventComplete()`

**Computed helpers**:
- `getTotalRounds()` - Uses `calculateTotalRounds(numberOfPlayers)`
- `getCurrentRound()` - Count of completed turns
- `getCurrentAct()` - Current act (1, 2, or 3)
- `getProgressPercentage()` - 0-100%
- `isGameComplete()` - True when currentRound >= totalRounds
- `getPendingTransitionEvent()` - Checks for transition events to trigger
- `getNextPlayerForEvent()` - Next player for transition event
- `getEventState()` - Get transition event state

## Authentication

- NextAuth v5 with Google OAuth
- Custom sign-in page at `/auth/signin`
- Root layout wraps app with `SessionProvider`
- `HamburgerMenu` only renders when session exists

## Styling

- Tailwind v4 config in `app/globals.css` (`@theme`)
- `tailwind.config.ts` present for reference only (not used)

**Theme tokens**:
- Colors: `void`, `glitch`, `frost`, `mint`, `alert`, `steel-*`
- Fonts: Inter, JetBrains Mono
- Radius: `--radius-control` (12px), `--radius-card` (16px)
- Shadows: `--shadow-glow`, `--shadow-glow-strong`, `--shadow-glow-mint`

**Custom classes** in `app/globals.css`:
- `.glass`, `.scan-line`, `.glitch-text`, `.bg-grid-pattern`, `.noise-overlay`
- `.tap-shrink`, `.text-glow`, `.custom-scrollbar`

## Critical Guidelines

### AI Context Requirements ⚠️

**MANDATORY: Always send FULL game state to AI prompts when context is needed.**

Modern AI models have massive context windows (200K+ tokens). DO NOT artificially limit context with `.slice()` unless you have a documented reason.

**Examples**:
- ✅ All game turns: `gameState.turns.map(...)`
- ❌ Limited turns: `gameState.turns.slice(-8)` - causes question repetition
- ✅ All player turns: `playerTurns.map(...)`
- ❌ Limited player turns: `playerTurns.slice(-5)` - limits personalization

**Cost is not a concern.** Better AI experience > ~$0.01 per game in token costs.

### Act Boundaries

- Acts are 33%/66% splits using `Math.floor()`
- Must match `GameProgressBar.tsx` divider positions
- Calculated in [constants.ts:84](lib/constants.ts#L84)

### Mini-Game Eligibility

- Don't add artificial turn count requirements
- Act 1 collects data - just need ≥1 eligible turn
- Only Trivia/Personality Match require eligible turns

### AI Prompt Design

- **Goal-focused** beats restriction-heavy
- Show examples of what you WANT
- Keep prompts concise
- Treat 10+ year-olds as pre-teens/teens

### Turn Creation

- Both questions AND mini-games must call `addTurn()`
- Without turn creation, game progress stalls
- Mini-games call `addTurn()` during generation phase

### Score Application

- Mini-games return `MiniGameResult` with score
- `/play` must call `updatePlayerScore()` to apply it

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

## Version History

### v1.1.5 - Critical Bug Fixes (2026-01-22)

**Bug Fixes**:
- Fixed act boundary inconsistency (fractional vs floor)
- Fixed consecutive turns after transitions
- Fixed trivia eligibility gate (≥3 → ≥1)
- Fixed The Filter visibility in Act 2

**Code Cleanup**:
- Removed unused `getActBoundaries()`, `nextRound()`, `addPlayer()`, `removePlayer()`
- Removed redundant `currentAct` filter in transition formatting

### v1.1.4 - Critical Rollback (2026-01-21)

Fixed question repetition bug by sending full turn history instead of `.slice(-8)`.

### v1.1.3 - AI Prompt Improvements (2026-01-21)

Goal-focused prompts, expanded Act 1 examples, Trivia Challenge ordinal fix, Mad Libs energy, mini-game eligibility relaxed, Timed Binary UX fixes.

### v1.1.1 - Critical Bug Fixes (2026-01-18)

React Hooks violation, Hard Trivia props, mini-game turn tracking, score application, Play Again reset.

### v1.1.0 - Feature Additions (2026-01-15)

Fixed game header, Hard Trivia, The Filter, 0-5 scoring.

### v1.0.0 - Initial Release (2026-01-10)

Next.js 15 + React 19 + TypeScript, Google OAuth, GPT-5.2 tool calling, 6 input templates, 4 mini-games, 3-act structure.
