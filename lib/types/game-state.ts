/**
 * Game State Type Definitions
 *
 * Defines the structure for tracking game progress, turns, and player responses.
 * Flexible design allows different input templates to store varying data structures.
 */

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
  };
}

/**
 * Helper type for creating a new turn
 */
export type CreateTurnInput = Omit<Turn, 'turnId' | 'timestamp' | 'status' | 'response'> & {
  response?: Record<string, any>;
};
