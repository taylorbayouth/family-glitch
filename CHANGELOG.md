# Changelog

All notable changes to Family Glitch will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.3] - 2026-01-21

### Changed

#### AI Prompt Improvements
- **Game Master prompt**: Completely rewritten to be goal-focused instead of restriction-heavy
  - Removed "family-friendly" language that was causing overly cautious questions
  - Expanded Act 1 question examples: passions, skills, entertainment picks, local flavor, binary debates, interest grids
  - Added explicit guidance: "Avoid memory-check questions in Act 1 (answers are secret)"
  - Streamlined from ~200 lines to ~80 lines for better AI comprehension
- **Trivia Challenge prompt**: Fixed ordinal problem
  - Added "Ask about MEMORABLE or DISTINCTIVE parts, not list order"
  - Prevents impossible questions like "What was the SECOND thing they mentioned?"
- **Mad Libs prompt**: Edgier with Cards Against Humanity energy
  - Changed to exactly 2 blanks per template
  - Added 8 strong template examples that reward wit over shock value
  - Focus: "Make players feel WITTY, not just shocking"
- **Hard Trivia prompt**: Simplified and more direct
- Treat 10+ year-olds as pre-teens/teens, not kids

### Fixed
- **Mini-game eligibility constraints**: Removed artificial `>= 3 turns` requirement
  - Trivia and Personality Match now available with just 1 eligible turn
  - Rationale: Act 1 already collects player data, constraint was redundant
  - Updated: `game-master-prompt.ts`, `trivia-challenge/register.ts`, `eligibility.ts`
- **Personality Match config extraction**: Added player IDs to AI prompt
  - AI can now properly call `trigger_personality_match` with valid subject player IDs
  - Format: `Available subjects (use these EXACT IDs): Alice (id: "abc123"), Bob (id: "def456")`
- **Timed Binary pre-selection bug**: First button no longer appears pre-selected
  - Added `useEffect` to blur active element on mount
  - Added `focus:outline-none` to all buttons

### Added
- **Timed Binary "Neither" option**: Third button below main choices
  - Allows players to opt out of binary choices
  - Returns `choice: 'neither'` with `selectedText: 'Neither'`
- **CHANGELOG.md**: Version history tracking (this file)
- **ROADMAP.md**: Future plans moved from CHANGELOG

### Documentation
- Updated all documentation to reflect Act 1 special rules and mini-game eligibility
- Clarified act boundaries: 33%/66% splits (not 25%/75%)
- Added comprehensive git commit summaries

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
