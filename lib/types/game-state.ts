/**
 * Game State Type Definitions
 *
 * Defines the structure for tracking game progress, turns, and player responses.
 * Flexible design allows different input templates to store varying data structures.
 */

/**
 * When a transition event should trigger
 */
export interface TransitionTrigger {
  /** Which act boundary (1 = end of act 1, 2 = end of act 2) */
  afterAct: 1 | 2;
}

/**
 * A response collected from a player during a transition event
 */
export interface TransitionResponse {
  /** The event this response belongs to */
  eventId: string;

  /** ID of the player who provided this response */
  playerId: string;

  /** Player name (cached for display) */
  playerName: string;

  /** The question that was asked */
  question: string;

  /** Category tag for organizing/filtering responses */
  category: string;

  /** The player's response */
  response: string;

  /** When this response was collected */
  timestamp: string;
}

/**
 * Tracks the state of a single transition event
 */
export interface TransitionEventState {
  /** The event ID */
  eventId: string;

  /** Whether this event has been completed */
  complete: boolean;

  /** IDs of players who have completed this event */
  collectedFrom: string[];
}

/**
 * Represents a single turn in the game
 */
export interface Turn {
  /** Unique identifier for this turn */
  turnId: string;

  /** ID of the player taking this turn */
  playerId: string;

  /** Name of the player (cached for historical record) */
  playerName: string;

  /** The input template used for this turn (e.g., "tpl_text_area") */
  templateType: string;

  /** When this turn started (ISO 8601 string) */
  timestamp: string;

  /** The question or prompt from the AI */
  prompt: string;

  /** Template-specific configuration (labels, options, timer duration, etc.) */
  templateParams: Record<string, any>;

  /** User's response - structure varies by template type */
  response: Record<string, any> | null;

  /** Optional score assigned to this turn */
  score?: number;

  /** AI's commentary or response after the turn */
  aiCommentary?: string;

  /** Time taken to complete the turn (in seconds) */
  duration?: number;

  /** Whether this turn was completed or skipped/timed out */
  status: 'pending' | 'completed' | 'skipped' | 'timeout';
}

/**
 * Main game state structure
 */
export interface GameState {
  /** Unique identifier for this game session */
  gameId: string;

  /** When the game started (ISO 8601 string) */
  startedAt: string;

  /** When the game ended (ISO 8601 string, if completed) */
  endedAt?: string;

  /** Array of all turns in chronological order */
  turns: Turn[];

  /** Index of the current turn being played */
  currentTurnIndex: number;

  /** Current game status */
  status: 'setup' | 'playing' | 'paused' | 'completed';

  /** Overall game scores by player ID */
  scores: Record<string, number>;

  /** Game settings/metadata */
  settings?: {
    /** Total number of rounds to play */
    totalRounds?: number;

    /** Difficulty level (affects AI behavior) */
    difficulty?: 'casual' | 'spicy' | 'savage';

    /** Whether to allow voting/targeting mechanics */
    allowTargeting?: boolean;

    /** Number of players in this game (stored at game start) */
    numberOfPlayers?: number;
  };

  /** Responses collected from players during transition events */
  transitionResponses?: TransitionResponse[];

  /** Tracks which transition events have been completed */
  transitionEvents?: Record<string, TransitionEventState>;
}

/**
 * Helper type for creating a new turn
 */
export type CreateTurnInput = Omit<Turn, 'turnId' | 'timestamp' | 'status' | 'response'> & {
  response?: Record<string, any>;
};

// Legacy type aliases for backward compatibility
export type PlayerInsight = TransitionResponse;
export type ActTransitions = {
  act1InsightsComplete: boolean;
  act1InsightsCollectedFrom: string[];
};
