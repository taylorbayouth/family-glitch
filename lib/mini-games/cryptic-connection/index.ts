/**
 * Cryptic Connection Mini-Game
 *
 * Flow:
 * 1. AI generates a cryptic clue and 25-word grid
 * 2. Player selects words they think connect to the clue
 * 3. AI scores with fuzzy logic (exact + creative matches)
 *
 * The puzzle is intentionally vague - perfect scores should be rare.
 */

export {
  buildCrypticGeneratorPrompt,
  buildCrypticScorerPrompt,
  parseCrypticGeneratorResponse,
  parseCrypticScoreResponse,
  toMiniGameResult,
  type CrypticGenerateResponse,
  type CrypticScoreResponse,
} from './prompt';
