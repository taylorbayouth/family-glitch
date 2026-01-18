/**
 * ============================================================================
 * LLM CLIENT - Client-Side API Wrapper
 * ============================================================================
 *
 * This module provides a clean interface for components to request LLM
 * content generation. It handles:
 * - HTTP communication with /api/llm
 * - Retry logic with exponential backoff
 * - Error handling and logging
 * - Request/response validation
 *
 * Design principles:
 * - Simple async API (async/await)
 * - Automatic retries on transient failures
 * - Detailed error messages
 * - Type-safe requests and responses
 */

import { LLMRequest, LLMResponse, GameState, EventLog, FactsDB, Player } from '@/types/game';
import { LLM } from '@/lib/constants';
import { compactHistoryForLLM } from '@/lib/eventLog';
import { getRelevantFactsForCartridge } from '@/lib/factsDB';

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * LLM-specific error class
 */
export class LLMError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

// ============================================================================
// CORE API CALL
// ============================================================================

/**
 * Call the LLM API with retry logic
 *
 * @param request - LLM request payload
 * @param retries - Number of retries remaining (default: 3)
 * @returns LLM response
 * @throws LLMError on failure
 */
export async function callLLM(
  request: LLMRequest,
  retries: number = LLM.MAX_RETRIES
): Promise<LLMResponse> {
  try {
    // Make HTTP request to API route
    const response = await fetch('/api/llm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    // Handle non-OK responses
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));

      // Determine if error is retryable
      const isRetryable =
        response.status === 429 || // Rate limit
        response.status === 500 || // Server error
        response.status === 503; // Service unavailable

      throw new LLMError(
        error.error || `HTTP ${response.status}`,
        response.status,
        isRetryable
      );
    }

    // Parse successful response
    const data: LLMResponse = await response.json();

    // Validate response structure
    if (!data.nextState || !data.screen || !data.safetyFlags) {
      throw new LLMError('Invalid response structure', undefined, false);
    }

    return data;
  } catch (error: any) {
    // If we have retries left and error is retryable, retry
    if (retries > 0 && (error.retryable || error.name === 'TypeError')) {
      console.warn(`LLM call failed, retrying... (${retries} retries left)`);

      // Exponential backoff
      await sleep(LLM.RETRY_DELAY_MS * (LLM.MAX_RETRIES - retries + 1));

      return callLLM(request, retries - 1);
    }

    // No more retries or non-retryable error
    if (error instanceof LLMError) {
      throw error;
    }

    // Wrap unknown errors
    throw new LLMError(
      `Failed to call LLM: ${error.message}`,
      undefined,
      false
    );
  }
}

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// HIGH-LEVEL REQUEST BUILDERS
// ============================================================================

/**
 * Request a fact-gathering prompt for Act 1
 *
 * @param state - Current game state
 * @param eventLog - Event history
 * @param players - All players
 * @param scores - Current scores
 * @returns LLM response with prompt
 */
export async function requestFactPrompt(
  state: GameState,
  eventLog: EventLog,
  players: Player[],
  scores: Record<string, number>
): Promise<LLMResponse> {
  const request: LLMRequest = {
    sessionId: state.sessionId,
    currentState: state.currentState,
    currentAct: state.currentAct,
    players,
    activePlayerId: state.activePlayerId,
    recentEvents: compactHistoryForLLM(eventLog, LLM.RECENT_EVENTS_COUNT),
    factsDB: [], // No facts yet in Act 1
    currentScores: scores,
    timeElapsedMs: Date.now() - state.startTime,
    targetDurationMs: state.targetDurationMs,
    act1FactCount: 0, // Will be calculated by caller
    act2RoundsCompleted: 0,
    requestType: 'next-prompt',
    safetyMode: 'kid-safe', // TODO: Get from GameSetup
  };

  return callLLM(request);
}

/**
 * Request cartridge selection and intro for Act 2
 *
 * @param state - Current game state
 * @param eventLog - Event history
 * @param factsDB - Facts database
 * @param players - All players
 * @param scores - Current scores
 * @param safetyMode - Content safety level
 * @returns LLM response with cartridge intro
 */
export async function requestCartridgeSelection(
  state: GameState,
  eventLog: EventLog,
  factsDB: FactsDB,
  players: Player[],
  scores: Record<string, number>,
  safetyMode: 'kid-safe' | 'teen-adult'
): Promise<LLMResponse> {
  const request: LLMRequest = {
    sessionId: state.sessionId,
    currentState: state.currentState,
    currentAct: state.currentAct,
    players,
    activePlayerId: state.activePlayerId,
    recentEvents: compactHistoryForLLM(eventLog, LLM.RECENT_EVENTS_COUNT),
    factsDB: getRelevantFactsForCartridge(factsDB, undefined, LLM.MAX_FACTS_IN_CONTEXT),
    currentScores: scores,
    timeElapsedMs: Date.now() - state.startTime,
    targetDurationMs: state.targetDurationMs,
    act1FactCount: factsDB.facts.length,
    act2RoundsCompleted: 0, // TODO: Calculate from event log
    requestType: 'select-cartridge',
    safetyMode,
  };

  return callLLM(request);
}

/**
 * Request a reveal format for a submitted answer
 *
 * @param state - Current game state
 * @param players - All players
 * @param answer - The answer to reveal
 * @param safetyMode - Content safety level
 * @returns LLM response with reveal template
 */
export async function requestReveal(
  state: GameState,
  players: Player[],
  answer: any,
  safetyMode: 'kid-safe' | 'teen-adult'
): Promise<LLMResponse> {
  const request: LLMRequest = {
    sessionId: state.sessionId,
    currentState: state.currentState,
    currentAct: state.currentAct,
    players,
    activePlayerId: state.activePlayerId,
    recentEvents: [],
    factsDB: [],
    currentScores: {},
    timeElapsedMs: Date.now() - state.startTime,
    targetDurationMs: state.targetDurationMs,
    act1FactCount: 0,
    act2RoundsCompleted: 0,
    requestType: 'generate-reveal',
    safetyMode,
    lastAnswer: answer,
  };

  return callLLM(request);
}

/**
 * Request scoring guidance for judges
 *
 * @param state - Current game state
 * @param players - All players
 * @param safetyMode - Content safety level
 * @returns LLM response with scoring config
 */
export async function requestScoringGuidance(
  state: GameState,
  players: Player[],
  safetyMode: 'kid-safe' | 'teen-adult'
): Promise<LLMResponse> {
  const request: LLMRequest = {
    sessionId: state.sessionId,
    currentState: state.currentState,
    currentAct: state.currentAct,
    players,
    activePlayerId: state.activePlayerId,
    recentEvents: [],
    factsDB: [],
    currentScores: {},
    timeElapsedMs: Date.now() - state.startTime,
    targetDurationMs: state.targetDurationMs,
    act1FactCount: 0,
    act2RoundsCompleted: 0,
    requestType: 'suggest-scoring',
    safetyMode,
  };

  return callLLM(request);
}

/**
 * Request an act transition screen
 *
 * @param state - Current game state
 * @param players - All players
 * @param fromAct - Current act
 * @param toAct - Next act
 * @param safetyMode - Content safety level
 * @returns LLM response with transition content
 */
export async function requestActTransition(
  state: GameState,
  players: Player[],
  fromAct: number,
  toAct: number,
  safetyMode: 'kid-safe' | 'teen-adult'
): Promise<LLMResponse> {
  const request: LLMRequest = {
    sessionId: state.sessionId,
    currentState: state.currentState,
    currentAct: state.currentAct,
    players,
    activePlayerId: null, // Transitions are group screens
    recentEvents: [],
    factsDB: [],
    currentScores: {},
    timeElapsedMs: Date.now() - state.startTime,
    targetDurationMs: state.targetDurationMs,
    act1FactCount: 0,
    act2RoundsCompleted: 0,
    requestType: 'act-transition',
    safetyMode,
  };

  return callLLM(request);
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Check if LLM is available (API key configured)
 *
 * @returns true if LLM can be used
 */
export function isLLMAvailable(): boolean {
  // This check happens client-side, so we can't directly check env vars
  // Instead, we'll make a test request or assume it's available
  // (The API route will fail gracefully if key is missing)
  return true;
}

/**
 * Get estimated token count for a request
 *
 * Rough estimation: 1 token ≈ 4 characters
 *
 * @param request - LLM request
 * @returns Estimated token count
 */
export function estimateTokenCount(request: LLMRequest): number {
  const json = JSON.stringify(request);
  return Math.ceil(json.length / 4);
}
