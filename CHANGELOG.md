# Changelog

All notable changes to Family Glitch will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-01-20

### Added
- Shared mini-game component library in `components/mini-games/shared/`:
  - `LoadingSpinner`: Animated loading indicator with ARIA labels
  - `ScoreDisplay`: Large animated score card with accessibility support
  - `CommentaryCard`: AI commentary display with emoji
  - `ErrorToast`: Fixed error notification with retry/dismiss buttons
  - `IntroScreen`: Full-screen animated intro with game-specific theming
- Shared utility functions in `lib/mini-games/utils.ts`:
  - `extractAndParseJSON()`: Safe JSON parsing with error handling
  - `getScoreColor()`, `getScoreBg()`: Consistent score color coding
  - `safePlayerName()`, `safeArray()`: Defensive null handling
  - `clamp()`, `formatList()`: Math and formatting helpers
- Centralized game themes in `lib/mini-games/themes.ts` with unique color schemes
- ARIA accessibility labels throughout mini-games:
  - `role="status"` for loading indicators
  - `aria-live="polite"` for score announcements
  - `aria-label` for all interactive elements
- CHANGELOG.md for version history tracking

### Fixed
- TypeScript type safety issues:
  - Added `'the_filter'` to `MiniGameType` union
  - Fixed all 6 register files to use proper `ComponentType<BaseMiniGameProps>` instead of `as any`
  - Added `TheFilterUI` to barrel exports in `components/mini-games/index.ts`
- Responsive grid layouts for mobile devices:
  - CrypticConnectionUI now uses 3 cols (mobile) → 4 cols (tablet) → 5 cols (desktop)
  - Improved mobile experience for word grids
- Z-index conflicts: Error toasts now use `z-[60]` to appear above intro screens
- Border radius consistency: Standardized all grid items to use `rounded-xl`

### Changed
- The Filter theme changed from cyan to teal to avoid conflict with Hard Trivia
- Extracted magic numbers to named constants:
  - `TURN_SELECTION_WEIGHTS` in `lib/mini-games/eligibility.ts`
  - `CRYPTIC_GRID_SIZE` in `lib/mini-games/cryptic-connection/prompt.ts`
- Optimized background animations (opacity-only for better performance)

### Removed
- Unused exports from public API:
  - `isTriviaEligible()` from `lib/mini-games/eligibility.ts`
  - `createTriviaChallengeSession()` from `lib/mini-games/trivia-challenge/index.ts`

### Documentation
- Updated GAME_FLOW_ISSUES.md to mark v1.1.1 fixes as resolved
- Updated GAME_FLOW.md to reflect mini-games creating turn entries
- Updated lib/mini-games/README.md with shared components documentation
- Updated README.md to mention 6 mini-games and accessibility features
- Updated AGENTS.md with v1.2.0 refactoring details

### Performance
- Reduced code duplication by ~40% through shared components
- Simplified animations for better mobile performance

## [1.1.1] - 2026-01-18

### Fixed

#### Critical Bug Fixes
- **React Hooks Violation**: Moved `useState` call out of conditional error render block in `/play` to comply with Rules of Hooks
- **Hard Trivia Props Mismatch**: Renamed `currentPlayer` to `targetPlayer` in `HardTriviaUI` to match mini-game convention. Added `turns` prop to all mini-game renders
- **Mini-game Progress Tracking**: Mini-games now create turn entries via `addTurn()` and complete them with results, fixing game progression stalls in Act 2+
- **Score Application**: `handleMiniGameComplete()` now properly calls `updatePlayerScore()` to apply mini-game scores to the leaderboard
- **Play Again Reset**: End-game "Play Again" button now calls `resetGame()` before routing to setup, clearing stale state

#### AI Prompt Improvements
- All mini-game prompt builders now include comprehensive null safety checks
- Defensive patterns: `const safeName = object?.name || 'Default'` and `const safeArray = (array || []).filter(p => p && p.name)`
- Prevents "undefined is not an object" errors during AI generation
- Applied to: trivia-challenge, cryptic-connection, madlibs-challenge, personality-match, hard-trivia

### Changed

#### UI/UX Improvements
- Removed vertical scrolling from all input templates by replacing vertical centering with top-aligned flex layouts
- Increased leaderboard player tile spacing (6px → 12px)
- Made progress bar taller (12px → 20px) with more vibrant colors and stronger glow
- Reduced margin under game header to eliminate gap between header and content
- Reduced top padding on all template content areas (16px → 4px)

## [1.1.0] - 2026-01-15

### Added
- Fixed game header with leaderboard, scores, and progress bar
- Hard Trivia mini-game with family interest-based questions
- The Filter mini-game (grid-based selection game)

### Changed
- Restructured game to use 0-5 scoring for all mini-games
- Mini-games now only appear in Acts 2-3
- Updated announcer API to use GPT-5.2

### Fixed
- Various game flow improvements
- UI/UX consistency fixes

## [1.0.0] - 2026-01-10

### Added
- Initial release of Family Glitch
- Next.js 15 App Router with React 19 and TypeScript
- Google OAuth via NextAuth v5
- GPT-5.2 chat completions with server-side tool execution
- Template-driven input system (6 templates)
- Mini-game registry with 4 games:
  - Trivia Challenge
  - Personality Match
  - Mad Libs Challenge
  - Cryptic Connection
- End-game announcer results (AI rankings and blurbs)
- Zustand stores with localStorage persistence
- Tailwind CSS v4 theme tokens
- Framer Motion animations
- Pass-and-play gameplay flow
- Player setup with avatars and roles
- 3-act game structure
