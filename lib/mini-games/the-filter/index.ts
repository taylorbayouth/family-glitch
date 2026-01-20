/**
 * The Filter Mini-Game
 *
 * Binary classification puzzle where players identify all items that pass a specific rule.
 * Tests knowledge, estimation, and logical thinking.
 */

export {
  buildFilterGeneratorPrompt,
  buildFilterScorerPrompt,
  parseFilterGeneratorResponse,
  parseFilterScoreResponse,
  toMiniGameResult,
  type FilterGenerateResponse,
  type FilterScoreResponse,
} from './prompt';
