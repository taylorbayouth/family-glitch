/**
 * Mini-Games System
 *
 * Central registry and exports for all mini-games.
 * Mini-games are interactive challenge sequences with their own AI personalities.
 *
 * ARCHITECTURE:
 * - Each mini-game is a self-contained module in its own folder
 * - Mini-games self-register via the registry system
 * - The play page uses the registry to dynamically handle any mini-game
 * - Adding a new mini-game requires ZERO changes to play/page.tsx!
 *
 * To add a new mini-game:
 * 1. Create folder: /lib/mini-games/your-game/
 * 2. Add prompt.ts for AI prompts
 * 3. Add register.ts to register with the system
 * 4. Create UI in /components/mini-games/YourGameUI.tsx
 * 5. Add AI tool in /lib/ai/template-tools.ts
 */

// Registry system - import first to initialize
export * from './registry';

// Import all registrations to trigger self-registration
// These imports have side effects (they call registerMiniGame)
import './trivia-challenge/register';
import './personality-match/register';
import './madlibs-challenge/register';
import './cryptic-connection/register';

// Types and utilities
export * from './types';
export * from './eligibility';
export * from './trivia-challenge';

// Explicit exports to avoid name conflicts with toMiniGameResult
export {
  DEFAULT_PERSONALITY_WORDS,
  selectWordsForGrid,
  getTurnsAboutPlayer,
  buildPersonalityMatchPrompt,
  parsePersonalityMatchResponse,
  toMiniGameResult as personalityMatchToResult,
} from './personality-match';
export type { PersonalityMatchScoreResponse } from './personality-match';

export {
  COMMON_LETTERS,
  selectRandomLetters,
  buildMadLibsGeneratorPrompt,
  buildMadLibsScorerPrompt,
  parseMadLibsGeneratorResponse,
  parseMadLibsScoreResponse,
  fillTemplate,
  createBlanksFromTemplate,
  toMiniGameResult as madLibsToResult,
} from './madlibs-challenge';
export type { MadLibsGenerateResponse, MadLibsScoreResponse } from './madlibs-challenge';

export {
  buildCrypticGeneratorPrompt,
  buildCrypticScorerPrompt,
  parseCrypticGeneratorResponse,
  parseCrypticScoreResponse,
  toMiniGameResult as crypticToResult,
} from './cryptic-connection';
export type { CrypticGenerateResponse, CrypticScoreResponse } from './cryptic-connection';
