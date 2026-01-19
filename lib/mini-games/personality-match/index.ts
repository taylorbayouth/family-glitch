/**
 * Personality Match Mini-Game
 *
 * Player selects ALL words (no cap) that match a target player's personality.
 * AI scores based on the group's previous responses about that player.
 */

export {
  DEFAULT_PERSONALITY_WORDS,
  selectWordsForGrid,
  getTurnsAboutPlayer,
  buildPersonalityMatchPrompt,
  parsePersonalityMatchResponse,
  toMiniGameResult,
  type PersonalityMatchScoreResponse,
} from './prompt';
