/**
 * Lighting Round Mini-Game
 *
 * Flow:
 * 1. AI generates a binary question using full game context
 * 2. Player answers 5 rapid-fire questions
 * 3. Score is +/- 5 per question
 */

export {
  buildLightingRoundQuestionPrompt,
  parseLightingRoundQuestionResponse,
  getAllMiniGamesPlayed,
  type LightingRoundHistoryItem,
  type LightingRoundPromptContext,
  type LightingRoundQuestionResponse,
} from './prompt';
