/**
 * ============================================================================
 * STATE MACHINE - Game Flow Controller
 * ============================================================================
 *
 * This module manages the game's state machine - the strict flow of screens
 * and transitions from setup through gameplay to completion.
 *
 * Key responsibilities:
 * - Validate state transitions (prevent invalid jumps)
 * - Track current state and provide transition functions
 * - Integrate with event log (every transition is recorded)
 * - Provide queries about state (isInAct, canTransitionTo, etc.)
 *
 * Design principles:
 * - Immutable state updates (returns new state, never mutates)
 * - Type-safe transitions (TypeScript prevents invalid moves)
 * - Every transition generates an event
 */

import { GameState, GameStateType, ActNumber, GameEvent, StateTransitionEvent } from '@/types/game';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// VALID TRANSITIONS MAP
// ============================================================================

/**
 * State transition rules - defines which states can follow which
 * This is the "railroad tracks" of the game flow
 *
 * Format: { currentState: [allowedNextStates] }
 *
 * Why strict transitions matter:
 * - Prevents bugs (can't jump from setup to Act 3)
 * - Makes flow predictable for testing
 * - Helps debugging (if you see an invalid transition, something's wrong)
 */
const VALID_TRANSITIONS: Record<GameStateType, GameStateType[]> = {
  // Setup can only go to Act 1
  SETUP: ['ACT1_FACT_PROMPT_PRIVATE'],

  // Act 1 flow: prompt → confirm → (repeat or transition)
  ACT1_FACT_PROMPT_PRIVATE: ['ACT1_FACT_CONFIRM'],
  ACT1_FACT_CONFIRM: ['ACT1_FACT_PROMPT_PRIVATE', 'ACT1_TRANSITION'],
  ACT1_TRANSITION: ['ACT2_CARTRIDGE_ACTIVE'],

  // Act 2 flow: cartridge manages its own flow
  // Cartridge active can transition to:
  // - Itself (next cartridge)
  // - Act 2 transition (end of Act 2)
  ACT2_CARTRIDGE_ACTIVE: [
    'ACT2_CARTRIDGE_ACTIVE', // Next cartridge
    'ACT2_TRANSITION', // Move to Act 3
  ],
  ACT2_TRANSITION: ['ACT3_FINAL_REVEAL'],

  // Act 3 flow: reveals → highlights → tally → end
  ACT3_FINAL_REVEAL: ['ACT3_HIGHLIGHTS'],
  ACT3_HIGHLIGHTS: ['ACT3_TALLY'],
  ACT3_TALLY: ['END'],

  // End state - terminal (can only restart from here)
  END: [],
};

/**
 * Act map - which act each state belongs to
 * Used to auto-update gameState.currentAct when transitioning
 */
const STATE_TO_ACT: Record<GameStateType, ActNumber | null> = {
  SETUP: null,
  ACT1_FACT_PROMPT_PRIVATE: 1,
  ACT1_FACT_CONFIRM: 1,
  ACT1_TRANSITION: 1,
  ACT2_CARTRIDGE_ACTIVE: 2,
  ACT2_TRANSITION: 2,
  ACT3_FINAL_REVEAL: 3,
  ACT3_HIGHLIGHTS: 3,
  ACT3_TALLY: 3,
  END: null,
};

// ============================================================================
// TRANSITION FUNCTIONS
// ============================================================================

/**
 * Check if a state transition is valid
 *
 * @param from - Current state
 * @param to - Desired next state
 * @returns true if transition is allowed
 */
export function canTransition(from: GameStateType, to: GameStateType): boolean {
  const allowedTransitions = VALID_TRANSITIONS[from];
  return allowedTransitions.includes(to);
}

/**
 * Execute a state transition
 *
 * This is the core function for moving through the game.
 * It validates the transition, updates the state, and generates an event.
 *
 * @param currentState - Current game state
 * @param nextState - Desired next state
 * @returns Tuple of [updated state, transition event]
 * @throws Error if transition is invalid
 */
export function transition(
  currentState: GameState,
  nextState: GameStateType
): [GameState, StateTransitionEvent] {
  // Validate transition
  if (!canTransition(currentState.currentState, nextState)) {
    throw new Error(
      `Invalid state transition: ${currentState.currentState} → ${nextState}. ` +
        `Allowed transitions from ${currentState.currentState}: ${VALID_TRANSITIONS[currentState.currentState].join(', ')}`
    );
  }

  // Determine new act number
  const newAct = STATE_TO_ACT[nextState];

  // Create transition event
  const event: StateTransitionEvent = {
    id: uuidv4(),
    type: 'STATE_TRANSITION',
    timestamp: Date.now(),
    actNumber: newAct || currentState.currentAct,
    activePlayerId: currentState.activePlayerId,
    stateFrom: currentState.currentState,
    stateTo: nextState,
  };

  // Create updated state (immutable update)
  const updatedState: GameState = {
    ...currentState,
    currentState: nextState,
    currentAct: newAct || currentState.currentAct,
    lastUpdated: Date.now(),

    // Update act completion times
    act1CompleteTime:
      nextState === 'ACT1_TRANSITION'
        ? Date.now()
        : currentState.act1CompleteTime,
    act2CompleteTime:
      nextState === 'ACT2_TRANSITION'
        ? Date.now()
        : currentState.act2CompleteTime,
  };

  return [updatedState, event];
}

/**
 * Get all valid next states from current state
 *
 * Useful for UI (show available actions) and testing
 *
 * @param currentState - Current state
 * @returns Array of allowed next states
 */
export function getValidNextStates(currentState: GameStateType): GameStateType[] {
  return VALID_TRANSITIONS[currentState] || [];
}

// ============================================================================
// STATE QUERIES
// ============================================================================

/**
 * Check if currently in a specific act
 */
export function isInAct(state: GameState, act: ActNumber): boolean {
  return state.currentAct === act;
}

/**
 * Check if a state is a "private input" state where peeking privacy matters
 */
export function isPrivateInputState(state: GameStateType): boolean {
  return state === 'ACT1_FACT_PROMPT_PRIVATE';
  // Note: ACT2_CARTRIDGE_ACTIVE cartridges manage their own privacy
}

/**
 * Check if a state is a "public reveal" state where everyone should see
 */
export function isPublicRevealState(state: GameStateType): boolean {
  return state === 'ACT3_FINAL_REVEAL';
  // Note: ACT2_CARTRIDGE_ACTIVE cartridges manage their own reveal flow
}

/**
 * Check if a state is a "scoring" state where judges award points
 */
export function isScoringState(state: GameStateType): boolean {
  return false;
  // Note: ACT2_CARTRIDGE_ACTIVE cartridges manage their own scoring
}

/**
 * Check if a state is a "transition" state (between acts)
 */
export function isTransitionState(state: GameStateType): boolean {
  return (
    state === 'ACT1_TRANSITION' ||
    state === 'ACT2_TRANSITION' ||
    state === 'END'
  );
}

/**
 * Check if game is complete
 */
export function isGameComplete(state: GameState): boolean {
  return state.currentState === 'END';
}

/**
 * Get human-readable state name
 * Useful for debugging and logs
 */
export function getStateName(state: GameStateType): string {
  const names: Record<GameStateType, string> = {
    SETUP: 'Setup',
    ACT1_FACT_PROMPT_PRIVATE: 'Act 1: Fact Prompt',
    ACT1_FACT_CONFIRM: 'Act 1: Confirmation',
    ACT1_TRANSITION: 'Act 1 → 2 Transition',
    ACT2_CARTRIDGE_ACTIVE: 'Act 2: Mini-Game Active',
    ACT2_TRANSITION: 'Act 2 → 3 Transition',
    ACT3_FINAL_REVEAL: 'Act 3: Final Reveal',
    ACT3_HIGHLIGHTS: 'Act 3: Highlights',
    ACT3_TALLY: 'Act 3: Tally',
    END: 'Game Complete',
  };

  return names[state];
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Create initial game state after setup is complete
 *
 * @param sessionId - Unique session identifier
 * @param firstPlayerId - Who goes first
 * @param playerIds - All player IDs (for initializing turn counts)
 * @param targetDurationMs - Target session length
 * @returns Fresh game state ready for Act 1
 */
export function createInitialGameState(
  sessionId: string,
  firstPlayerId: string,
  playerIds: string[],
  targetDurationMs: number = 900000 // 15 minutes default
): GameState {
  // Initialize turn counts to 0 for all players
  const turnCounts: Record<string, number> = {};
  playerIds.forEach((id) => {
    turnCounts[id] = 0;
  });

  return {
    currentState: 'ACT1_FACT_PROMPT_PRIVATE',
    currentAct: 1,
    activePlayerId: firstPlayerId,
    nextPlayerId: null, // Will be set by turn manager
    startTime: Date.now(),
    targetDurationMs,
    act1CompleteTime: null,
    act2CompleteTime: null,
    turnCounts,
    activeCartridgeId: null,
    cartridgeInstanceId: null,
    sessionId,
    lastUpdated: Date.now(),
  };
}
