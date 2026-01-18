/**
 * ============================================================================
 * PACING SYSTEM - Smart Session Duration Management
 * ============================================================================
 *
 * This module keeps the game moving at the right pace - not too fast,
 * not too slow. It decides when to transition between acts based on
 * time elapsed, content gathered, and rounds completed.
 *
 * Key responsibilities:
 * - Monitor session progress (time vs target)
 * - Decide when to end Act 1 (enough facts gathered)
 * - Decide when to end Act 2 (time running out)
 * - Calculate recommended round counts
 * - Provide urgency signals to the LLM
 *
 * Design principles:
 * - Adaptive (adjusts to actual gameplay speed)
 * - Graceful (never abruptly cuts off mid-fun)
 * - Predictable (players shouldn't be surprised by timing)
 */

import { GameState, EventLog, FactsDB, Player, ActNumber } from '@/types/game';
import { TIMING, ACT1, ACT2 } from '@/lib/constants';
import { getEventsByAct, countEventsByType } from '@/lib/eventLog';
import { hasSufficientFacts } from '@/lib/factsDB';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Urgency level - signals how much time pressure there is
 *
 * This affects LLM behavior:
 * - relaxed: Complex prompts, longer rounds, more exploration
 * - steady: Normal pace, balanced content
 * - urgent: Shorter prompts, faster rounds, move toward conclusion
 */
export type UrgencyLevel = 'relaxed' | 'steady' | 'urgent';

/**
 * Pacing guide - comprehensive pacing analysis
 *
 * This is the "advice" the game engine uses to make decisions
 */
export interface PacingGuide {
  // Time analysis
  elapsedMs: number;
  targetDurationMs: number;
  timeRemainingMs: number;
  progressPercent: number;

  // Act-specific guidance
  shouldEndAct1: boolean;
  shouldEndAct2: boolean;
  shouldEndAct3: boolean;

  // Round recommendations
  recommendedAct2Rounds: number;
  act2RoundsCompleted: number;

  // Urgency signaling
  urgencyLevel: UrgencyLevel;

  // Reasons (for debugging)
  reasons: string[];
}

/**
 * Act progress - how far through each act
 */
export interface ActProgress {
  act1Percent: number;
  act2Percent: number;
  act3Percent: number;
  currentActPercent: number;
}

// ============================================================================
// CORE PACING CALCULATION
// ============================================================================

/**
 * Calculate comprehensive pacing guidance
 *
 * This is the main function that analyzes the current game state
 * and provides recommendations for what to do next.
 *
 * @param state - Current game state
 * @param eventLog - Event history
 * @param factsDB - Facts database
 * @param players - All players
 * @returns Pacing guide with recommendations
 */
export function calculatePacing(
  state: GameState,
  eventLog: EventLog,
  factsDB: FactsDB,
  players: Player[]
): PacingGuide {
  // Basic time calculations
  const now = Date.now();
  const elapsedMs = now - state.startTime;
  const targetDurationMs = state.targetDurationMs;
  const timeRemainingMs = Math.max(0, targetDurationMs - elapsedMs);
  const progressPercent = (elapsedMs / targetDurationMs) * 100;

  const reasons: string[] = [];

  // ===========================================================================
  // ACT 1 COMPLETION ANALYSIS
  // ===========================================================================

  let shouldEndAct1 = false;

  if (state.currentAct === 1) {
    const factCount = factsDB.facts.length;
    const targetFacts = Math.max(
      ACT1.MIN_FACTS,
      Math.ceil(players.length * ACT1.TARGET_FACTS_PER_PLAYER)
    );

    // Check fact threshold
    const hasEnoughFacts = hasSufficientFacts(factsDB, players.length);

    // Check time threshold (don't spend more than target % on Act 1)
    const act1TimeThreshold = targetDurationMs * TIMING.ACT1_TARGET_PERCENT;
    const act1TimeLimitReached = elapsedMs >= act1TimeThreshold;

    // Decision logic
    if (hasEnoughFacts) {
      shouldEndAct1 = true;
      reasons.push(`Act 1: Sufficient facts gathered (${factCount}/${targetFacts})`);
    } else if (act1TimeLimitReached && factCount >= ACT1.MIN_FACTS) {
      shouldEndAct1 = true;
      reasons.push(
        `Act 1: Time limit reached (${Math.round(elapsedMs / 60000)}min) with minimum facts`
      );
    } else if (factCount >= ACT1.MAX_FACTS) {
      shouldEndAct1 = true;
      reasons.push(`Act 1: Maximum facts reached (${factCount})`);
    }
  }

  // ===========================================================================
  // ACT 2 COMPLETION ANALYSIS
  // ===========================================================================

  let shouldEndAct2 = false;
  let act2RoundsCompleted = 0;
  let recommendedAct2Rounds: number = ACT2.TARGET_ROUNDS;

  if (state.currentAct === 2) {
    // Count completed cartridge rounds
    const cartridgeEvents = countEventsByType(eventLog);
    act2RoundsCompleted = cartridgeEvents['CARTRIDGE_COMPLETED'] || 0;

    // Calculate how many rounds we can fit in remaining time
    const avgRoundMs = ACT2.AVG_ACT2_ROUND_SEC * 1000;
    const act2EndThreshold = targetDurationMs * TIMING.ACT2_TARGET_PERCENT;
    const act2TimeRemaining = act2EndThreshold - elapsedMs;

    recommendedAct2Rounds = Math.max(
      ACT2.MIN_ROUNDS,
      Math.min(ACT2.MAX_ROUNDS, Math.floor(act2TimeRemaining / avgRoundMs))
    );

    // Check time threshold (transition to Act 3 around 80% mark)
    const shouldTransitionByTime = elapsedMs >= act2EndThreshold;

    // Check minimum rounds completed
    const hasMinimumRounds = act2RoundsCompleted >= ACT2.MIN_ROUNDS;

    // Check if we're approaching time limit
    const nearTimeLimit = timeRemainingMs < ACT2.MIN_TIME_FOR_NEW_ROUND_MS;

    // Decision logic
    if (shouldTransitionByTime && hasMinimumRounds) {
      shouldEndAct2 = true;
      reasons.push(
        `Act 2: Time threshold reached (${Math.round(progressPercent)}%) with ${act2RoundsCompleted} rounds`
      );
    } else if (nearTimeLimit && hasMinimumRounds) {
      shouldEndAct2 = true;
      reasons.push(
        `Act 2: Not enough time for another round (${Math.round(timeRemainingMs / 60000)}min left)`
      );
    } else if (act2RoundsCompleted >= ACT2.MAX_ROUNDS) {
      shouldEndAct2 = true;
      reasons.push(`Act 2: Maximum rounds reached (${act2RoundsCompleted})`);
    } else if (act2RoundsCompleted >= recommendedAct2Rounds) {
      shouldEndAct2 = true;
      reasons.push(
        `Act 2: Recommended rounds completed (${act2RoundsCompleted}/${recommendedAct2Rounds})`
      );
    }
  }

  // ===========================================================================
  // ACT 3 COMPLETION ANALYSIS
  // ===========================================================================

  let shouldEndAct3 = false;

  if (state.currentAct === 3) {
    // Act 3 ends when we reach the tally screen or run out of time
    const act3EndThreshold = targetDurationMs * TIMING.ACT3_TARGET_PERCENT;
    const shouldEndByTime = elapsedMs >= act3EndThreshold;

    if (shouldEndByTime) {
      shouldEndAct3 = true;
      reasons.push('Act 3: Approaching session time limit');
    }

    // Act 3 also naturally ends when state machine reaches END
    // (this is more of a soft signal)
  }

  // ===========================================================================
  // URGENCY LEVEL CALCULATION
  // ===========================================================================

  let urgencyLevel: UrgencyLevel;

  if (progressPercent < 33) {
    urgencyLevel = 'relaxed';
  } else if (progressPercent < 75) {
    urgencyLevel = 'steady';
  } else {
    urgencyLevel = 'urgent';
  }

  // ===========================================================================
  // ASSEMBLE PACING GUIDE
  // ===========================================================================

  return {
    elapsedMs,
    targetDurationMs,
    timeRemainingMs,
    progressPercent,
    shouldEndAct1,
    shouldEndAct2,
    shouldEndAct3,
    recommendedAct2Rounds,
    act2RoundsCompleted,
    urgencyLevel,
    reasons,
  };
}

// ============================================================================
// PROGRESS CALCULATION
// ============================================================================

/**
 * Calculate progress within each act
 *
 * This gives more granular progress info than overall session percent
 *
 * @param state - Current game state
 * @param pacing - Pacing guide
 * @returns Act-specific progress percentages
 */
export function calculateActProgress(
  state: GameState,
  pacing: PacingGuide
): ActProgress {
  const { progressPercent } = pacing;

  // Act boundaries (as percentages of total session)
  const act1End = TIMING.ACT1_TARGET_PERCENT * 100; // ~25%
  const act2End = TIMING.ACT2_TARGET_PERCENT * 100; // ~80%
  const act3End = TIMING.ACT3_TARGET_PERCENT * 100; // ~95%

  // Calculate progress within each act
  let act1Percent = 0;
  let act2Percent = 0;
  let act3Percent = 0;
  let currentActPercent = 0;

  if (state.currentAct === 1) {
    act1Percent = Math.min(100, (progressPercent / act1End) * 100);
    currentActPercent = act1Percent;
  } else if (state.currentAct === 2) {
    act1Percent = 100;
    act2Percent = Math.min(
      100,
      ((progressPercent - act1End) / (act2End - act1End)) * 100
    );
    currentActPercent = act2Percent;
  } else if (state.currentAct === 3) {
    act1Percent = 100;
    act2Percent = 100;
    act3Percent = Math.min(
      100,
      ((progressPercent - act2End) / (act3End - act2End)) * 100
    );
    currentActPercent = act3Percent;
  }

  return {
    act1Percent: Math.max(0, Math.min(100, act1Percent)),
    act2Percent: Math.max(0, Math.min(100, act2Percent)),
    act3Percent: Math.max(0, Math.min(100, act3Percent)),
    currentActPercent: Math.max(0, Math.min(100, currentActPercent)),
  };
}

// ============================================================================
// TIME FORMATTING
// ============================================================================

/**
 * Format milliseconds as MM:SS
 *
 * @param ms - Milliseconds
 * @returns Formatted time string
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format duration in a human-friendly way
 *
 * Examples: "2 min", "45 sec", "1 min 30 sec"
 *
 * @param ms - Milliseconds
 * @returns Human-readable duration
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds} sec`;
  } else if (seconds === 0) {
    return `${minutes} min`;
  } else {
    return `${minutes} min ${seconds} sec`;
  }
}

// ============================================================================
// PACING ADJUSTMENTS (FUTURE)
// ============================================================================

/**
 * Adjust target duration mid-session (future feature)
 *
 * This could allow players to extend or shorten the game
 * if they're having fun or need to wrap up quickly.
 *
 * @param state - Current game state
 * @param newTargetMs - New target duration
 * @returns Updated game state
 */
export function adjustTargetDuration(
  state: GameState,
  newTargetMs: number
): GameState {
  // Clamp to reasonable bounds
  const clampedTarget = Math.max(
    TIMING.MIN_DURATION_MS,
    Math.min(TIMING.MAX_DURATION_MS, newTargetMs)
  );

  return {
    ...state,
    targetDurationMs: clampedTarget,
    lastUpdated: Date.now(),
  };
}

/**
 * Get suggested target duration based on player count and age
 *
 * Could use this for smart defaults:
 * - More players = longer session
 * - Younger players = shorter session
 *
 * @param playerCount - Number of players
 * @param averageAge - Average player age
 * @returns Suggested duration (ms)
 */
export function getSuggestedDuration(
  playerCount: number,
  averageAge: number
): number {
  let baseDuration = TIMING.TARGET_DURATION_MS; // 15 minutes

  // Adjust for player count
  if (playerCount === 2) {
    baseDuration *= 0.8; // Shorter for 2 players
  } else if (playerCount >= 4) {
    baseDuration *= 1.1; // Slightly longer for 4 players
  }

  // Adjust for age (younger = shorter attention span)
  if (averageAge < 12) {
    baseDuration *= 0.85; // ~12-13 minutes for younger kids
  } else if (averageAge >= 16) {
    baseDuration *= 1.05; // ~16-17 minutes for teens/adults
  }

  // Clamp to reasonable bounds
  return Math.max(
    TIMING.MIN_DURATION_MS,
    Math.min(TIMING.MAX_DURATION_MS, Math.round(baseDuration))
  );
}

// ============================================================================
// DIAGNOSTIC HELPERS
// ============================================================================

/**
 * Get a human-readable pacing summary
 *
 * Useful for debugging and development UI
 */
export function getPacingSummary(pacing: PacingGuide): string {
  const lines: string[] = [
    'Pacing Summary:',
    `  Elapsed: ${formatDuration(pacing.elapsedMs)}`,
    `  Remaining: ${formatDuration(pacing.timeRemainingMs)}`,
    `  Progress: ${pacing.progressPercent.toFixed(1)}%`,
    `  Urgency: ${pacing.urgencyLevel}`,
    '',
    'Act Status:',
    `  Act 1 should end: ${pacing.shouldEndAct1 ? 'YES' : 'NO'}`,
    `  Act 2 should end: ${pacing.shouldEndAct2 ? 'YES' : 'NO'}`,
    `  Act 3 should end: ${pacing.shouldEndAct3 ? 'YES' : 'NO'}`,
    '',
    `Act 2: ${pacing.act2RoundsCompleted}/${pacing.recommendedAct2Rounds} rounds`,
    '',
    'Reasons:',
  ];

  pacing.reasons.forEach((reason) => {
    lines.push(`  - ${reason}`);
  });

  return lines.join('\n');
}
