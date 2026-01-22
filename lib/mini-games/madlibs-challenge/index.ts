/**
 * Mad Libs Challenge Mini-Game
 *
 * Flow:
 * 1. AI generates a sentence template with blanks
 * 2. System assigns random letters to each blank
 * 3. Player fills in words starting with those letters
 * 4. AI scores for creativity and humor (0-5)
 *
 * Works directly with turns array - no separate facts store needed.
 */

export {
  COMMON_LETTERS,
  selectRandomLetters,
  buildMadLibsGeneratorPrompt,
  buildMadLibsScorerPrompt,
  parseMadLibsGeneratorResponse,
  parseMadLibsScoreResponse,
  toMiniGameResult,
  fillTemplate,
  createBlanksFromTemplate,
  getPriorMadLibsGames,
  getAllMiniGamesPlayed,
  type MadLibsGenerateResponse,
  type MadLibsScoreResponse,
  type PriorMadLibsGame,
} from './prompt';
