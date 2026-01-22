/**
 * Mini-Game Eligibility Rules
 *
 * Determines when mini-games can be triggered during gameplay.
 * Works directly with the turns array - no separate facts store needed.
 */

import type { Turn } from '@/lib/types/game-state';
import type {
  EligibilityContext,
  EligibilityResult,
  MiniGameEligibilityDef,
  MiniGameType,
} from './types';

// ============================================================================
// TURN SELECTION SCORING WEIGHTS
// ============================================================================

/**
 * Scoring weights for selecting the best turn for trivia challenges.
 * Higher scores indicate more suitable turns for generating interesting questions.
 */
const TURN_SELECTION_WEIGHTS = {
  /** Bonus for non-binary template types (more nuanced answers) */
  NON_BINARY_TEMPLATE_BONUS: 50,

  /** Bonus for text response templates (rich content for questions) */
  TEXT_RESPONSE_BONUS: 30,

  /** Random variance to add unpredictability (0-40 points) */
  RANDOMNESS_RANGE: 40,
} as const;

// ============================================================================
// TURN QUERIES - Find usable turns for trivia
// ============================================================================

/**
 * Get turns that can be used to challenge a specific player
 * Rules:
 * - Must be completed turns
 * - Must be from a DIFFERENT player (can't quiz someone on their own answer)
 * - Must have a response with content
 */
export function getEligibleTurnsForPlayer(
  turns: Turn[],
  targetPlayerId: string
): Turn[] {
  return (turns || []).filter((turn) => {
    // Must be completed
    if (turn.status !== 'completed') return false;

    // Must be from a different player
    if (turn.playerId === targetPlayerId) return false;

    // Must have a response
    if (!turn.response) return false;

    // Must have meaningful content (not just null/empty)
    const responseStr = JSON.stringify(turn.response);
    if (responseStr === '{}' || responseStr === 'null') return false;

    return true;
  });
}

// ============================================================================
// TRIVIA CHALLENGE ELIGIBILITY
// ============================================================================

function checkTriviaChallengeEligibility(context: EligibilityContext): EligibilityResult {
  const { currentAct, currentPlayerId, turns } = context;

  // Rule 1: Must be in Act 2 or 3
  if (currentAct < 2) {
    return {
      eligible: false,
      reason: 'Trivia challenges unlock in Act II',
    };
  }

  // Rule 2: Must have completed turns from OTHER players
  const eligibleTurns = getEligibleTurnsForPlayer(turns, currentPlayerId);

  if (eligibleTurns.length === 0) {
    return {
      eligible: false,
      reason: 'Need answers from other players first',
    };
  }

  return {
    eligible: true,
    eligibleTurns,
  };
}

// ============================================================================
// PERSONALITY MATCH ELIGIBILITY
// ============================================================================

function checkPersonalityMatchEligibility(context: EligibilityContext): EligibilityResult {
  const { currentAct, currentPlayerId, turns } = context;

  // Rule 1: Must be in Act 2 or 3
  if (currentAct < 2) {
    return {
      eligible: false,
      reason: 'Personality match unlocks in Act II',
    };
  }

  // Rule 2: Must have completed turns from OTHER players
  const eligibleTurns = getEligibleTurnsForPlayer(turns, currentPlayerId);

  if (eligibleTurns.length === 0) {
    return {
      eligible: false,
      reason: 'Need answers from other players first',
    };
  }

  return {
    eligible: true,
    eligibleTurns,
  };
}

// ============================================================================
// MADLIBS CHALLENGE ELIGIBILITY
// ============================================================================

function checkMadLibsEligibility(context: EligibilityContext): EligibilityResult {
  const { currentAct } = context;

  // Rule 1: Must be in Act 3
  if (currentAct < 3) {
    return {
      eligible: false,
      reason: 'Mad Libs unlocks in Act III',
    };
  }

  // Mad Libs doesn't require other players' turns - it's standalone
  return {
    eligible: true,
  };
}

// ============================================================================
// CRYPTIC CONNECTION ELIGIBILITY
// ============================================================================

function checkCrypticConnectionEligibility(context: EligibilityContext): EligibilityResult {
  const { currentAct } = context;

  // Rule 1: Must be in Act 3
  if (currentAct < 3) {
    return {
      eligible: false,
      reason: 'Cryptic Connection unlocks in Act III',
    };
  }

  // Cryptic Connection doesn't require other players' turns - it's standalone
  return {
    eligible: true,
  };
}

// ============================================================================
// HARD TRIVIA ELIGIBILITY
// ============================================================================

function checkHardTriviaEligibility(context: EligibilityContext): EligibilityResult {
  const { currentAct, turns } = context;

  // Rule 1: Must be in Act 2 or 3
  if (currentAct < 2) {
    return {
      eligible: false,
      reason: 'Hard Trivia unlocks in Act II',
    };
  }

  // Rule 2: Should have some turns about interests/hobbies (but not strictly required)
  // Hard Trivia can work with general topics if no specific interests collected
  const interestTurns = (turns || []).filter(t =>
    t.status === 'completed' &&
    t.response &&
    (t.prompt?.toLowerCase().includes('interest') ||
     t.prompt?.toLowerCase().includes('hobby') ||
     t.prompt?.toLowerCase().includes('hobbies') ||
     t.prompt?.toLowerCase().includes('love') ||
     t.prompt?.toLowerCase().includes('favorite'))
  );

  return {
    eligible: true,
    eligibleTurns: interestTurns, // Passed to prompt builder for context
  };
}

// ============================================================================
// THE FILTER ELIGIBILITY
// ============================================================================

function checkTheFilterEligibility(context: EligibilityContext): EligibilityResult {
  const { currentAct } = context;

  // Rule 1: Must be in Act 2 or later
  if (currentAct < 2) {
    return {
      eligible: false,
      reason: 'The Filter unlocks in Act II',
    };
  }

  // The Filter doesn't require other players' turns - it's standalone
  return {
    eligible: true,
  };
}

// ============================================================================
// LIGHTING ROUND ELIGIBILITY
// ============================================================================

function checkLightingRoundEligibility(context: EligibilityContext): EligibilityResult {
  const { currentAct, currentPlayerId, turns } = context;

  // Rule 1: Must be in Act 3
  if (currentAct < 3) {
    return {
      eligible: false,
      reason: 'Lighting Round unlocks in Act III',
    };
  }

  // Rule 2: Need at least one completed turn from another player
  const eligibleTurns = getEligibleTurnsForPlayer(turns, currentPlayerId);

  if (eligibleTurns.length === 0) {
    return {
      eligible: false,
      reason: 'Need answers from other players first',
    };
  }

  return {
    eligible: true,
    eligibleTurns,
  };
}

// ============================================================================
// MINI-GAME REGISTRY
// ============================================================================

export const MINI_GAME_ELIGIBILITY: Record<MiniGameType, MiniGameEligibilityDef> = {
  trivia_challenge: {
    type: 'trivia_challenge',
    name: 'Trivia Challenge',
    description: 'Test how well you know your family based on their previous answers',
    minAct: 2,
    checkEligibility: checkTriviaChallengeEligibility,
  },
  personality_match: {
    type: 'personality_match',
    name: 'Personality Match',
    description: 'Select all words that describe another player based on their responses',
    minAct: 2,
    checkEligibility: checkPersonalityMatchEligibility,
  },
  madlibs_challenge: {
    type: 'madlibs_challenge',
    name: 'Mad Libs Challenge',
    description: 'Fill in the blanks with words starting with specific letters - scored for creativity',
    minAct: 3,
    checkEligibility: checkMadLibsEligibility,
  },
  cryptic_connection: {
    type: 'cryptic_connection',
    name: 'Cryptic Connection',
    description: 'Find hidden connections in a cryptic word puzzle - fuzzy scoring rewards creative thinking',
    minAct: 3,
    checkEligibility: checkCrypticConnectionEligibility,
  },
  hard_trivia: {
    type: 'hard_trivia',
    name: 'Hard Trivia',
    description: 'Answer challenging trivia questions based on the family\'s interests and hobbies',
    minAct: 2,
    checkEligibility: checkHardTriviaEligibility,
  },
  the_filter: {
    type: 'the_filter',
    name: 'The Filter',
    description: 'Select items that match a hidden pattern - pattern recognition and deduction',
    minAct: 2,
    checkEligibility: checkTheFilterEligibility,
  },
  lighting_round: {
    type: 'lighting_round',
    name: 'Lighting Round',
    description: 'Five rapid-fire binary questions about family members',
    minAct: 3,
    checkEligibility: checkLightingRoundEligibility,
  },
};

// ============================================================================
// PUBLIC API
// ============================================================================


/**
 * Select the best turn to use for a trivia challenge
 * Prioritizes:
 * 1. More interesting questions (not binary choices)
 * 2. More recent turns (fresher memory)
 * 3. Some randomness for variety
 */
export function selectTurnForTrivia(
  eligibleTurns: Turn[],
  usedTurnIds: string[] = []
): Turn | null {
  // Filter out already-used turns
  const unusedTurns = eligibleTurns.filter((t) => !usedTurnIds.includes(t.turnId));

  // If all turns used, allow repeats
  const candidates = unusedTurns.length > 0 ? unusedTurns : eligibleTurns;

  if (candidates.length === 0) return null;

  // Score each turn
  const scored = candidates.map((turn) => {
    let score = 0;

    // Prefer non-binary templates (more interesting answers)
    if (turn.templateType !== 'tpl_timed_binary') {
      score += TURN_SELECTION_WEIGHTS.NON_BINARY_TEMPLATE_BONUS;
    }

    // Prefer text responses (more to work with)
    if (turn.templateType === 'tpl_text_area' || turn.templateType === 'tpl_text_input') {
      score += TURN_SELECTION_WEIGHTS.TEXT_RESPONSE_BONUS;
    }

    // Add randomness to prevent always picking the same turn
    score += Math.random() * TURN_SELECTION_WEIGHTS.RANDOMNESS_RANGE;

    return { turn, score };
  });

  // Sort and pick best
  scored.sort((a, b) => b.score - a.score);
  return scored[0].turn;
}
