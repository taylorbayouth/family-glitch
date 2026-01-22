/**
 * Personality Match Mini-Game
 *
 * Player selects ALL words (no cap) that match a target player's personality.
 * AI scores based on the group's previous responses about that player.
 */

export {
  getTurnsAboutPlayer,
  buildPersonalityWordGeneratorPrompt,
  parsePersonalityWordGeneratorResponse,
  buildPersonalityMatchPrompt,
  parsePersonalityMatchResponse,
  toMiniGameResult,
  getPriorPersonalityMatches,
  getAllMiniGamesPlayed,
  type PersonalityWordGeneratorResponse,
  type PersonalityMatchScoreResponse,
  type PriorPersonalityMatchGame,
} from './prompt';
