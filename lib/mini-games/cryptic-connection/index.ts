/**
 * Cryptic Connection Mini-Game
 *
 * Flow:
 * 1. AI generates a brain teaser core idea + 25-word grid
 * 2. Player selects words they think connect to the core idea
 * 3. AI scores using a right/wrong key with tricky decoys
 *
 * The puzzle is intentionally tough but fair.
 */

export {
  buildCrypticGeneratorPrompt,
  buildCrypticScorerPrompt,
  parseCrypticGeneratorResponse,
  parseCrypticScoreResponse,
  toMiniGameResult,
  getPriorCrypticGames,
  getAllMiniGamesPlayed,
  type CrypticGenerateResponse,
  type CrypticScoreResponse,
  type WordScore,
  type PriorCrypticGame,
} from './prompt';
