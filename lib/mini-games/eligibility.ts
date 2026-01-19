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
  MiniGameDefinition,
  MiniGameType,
} from './types';

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
  return turns.filter((turn) => {
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

  // Rule 3: Should have at least 3 eligible turns for variety
  if (eligibleTurns.length < 3) {
    return {
      eligible: false,
      reason: 'Building knowledge... need more answers first',
      eligibleTurns,
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

export const MINI_GAME_REGISTRY: Record<MiniGameType, MiniGameDefinition> = {
  trivia_challenge: {
    type: 'trivia_challenge',
    name: 'Trivia Challenge',
    description: 'Test how well you know your family based on their previous answers',
    minAct: 2,
    checkEligibility: checkTriviaChallengeEligibility,
  },
};

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Check if trivia challenge is eligible for current player
 */
export function isTriviaEligible(context: EligibilityContext): EligibilityResult {
  return checkTriviaChallengeEligibility(context);
}

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
      score += 50;
    }

    // Prefer text responses (more to work with)
    if (turn.templateType === 'tpl_text_area' || turn.templateType === 'tpl_text_input') {
      score += 30;
    }

    // Add randomness
    score += Math.random() * 40;

    return { turn, score };
  });

  // Sort and pick best
  scored.sort((a, b) => b.score - a.score);
  return scored[0].turn;
}
