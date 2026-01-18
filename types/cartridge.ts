/**
 * ============================================================================
 * CARTRIDGE SYSTEM - Type Definitions
 * ============================================================================
 *
 * Cartridges are self-contained mini-games that run during Act 2.
 * Each cartridge is completely independent and controls its own flow.
 *
 * Design principles:
 * - Cartridges are modules that receive context and return results
 * - They manage their own state and UI flow
 * - They can control viewing mode (private, public, pass-around)
 * - They handle scoring and create their own TurnPackets
 * - They signal when complete via callback
 *
 * This architecture allows infinite extensibility - new cartridges can be
 * added without modifying core game logic.
 */

import {
  Player,
  FactsDB,
  EventLog,
  GameEvent,
  SafetyMode,
  LLMResponse,
} from './game';
import { TurnPacket } from './turnPacket';

// ============================================================================
// CARTRIDGE CONTEXT - What the Game Provides to Cartridges
// ============================================================================

/**
 * CartridgeContext - Everything a cartridge needs from the game
 *
 * This is the "contract" between the game and cartridges.
 * Cartridges receive this context and use it to run their game logic.
 */
export interface CartridgeContext {
  /** Session ID */
  sessionId: string;

  /** All players in the game */
  players: Player[];

  /** Facts gathered in Act 1 */
  factsDB: FactsDB;

  /** Event history (for context/patterns) */
  eventLog: EventLog;

  /** Current scores */
  currentScores: Record<string, number>;

  /** Safety mode (affects content appropriateness) */
  safetyMode: SafetyMode;

  /** Elapsed time in session (ms) */
  elapsedTime: number;

  /** Remaining time in session (ms) */
  remainingTime: number;

  // ===========================================================================
  // HELPER FUNCTIONS - Cartridges call these to interact with game
  // ===========================================================================

  /**
   * Record an event to the event log
   * Cartridges should log all significant actions
   */
  recordEvent: (event: Omit<GameEvent, 'id' | 'timestamp'>) => void;

  /**
   * Update player scores
   * Pass deltas (positive or negative changes)
   */
  updateScores: (deltas: Record<string, number>) => void;

  /**
   * Request LLM generation
   * Cartridges can call LLM for content, scoring, etc.
   */
  requestLLM: (request: CartridgeLLMRequest) => Promise<LLMResponse>;
}

/**
 * LLM request format for cartridges
 */
export interface CartridgeLLMRequest {
  /** What the LLM should generate */
  purpose:
    | 'generate-prompt' // Create a question/challenge
    | 'generate-content' // Create options/captions/etc
    | 'score-answers' // Evaluate and score submissions
    | 'generate-commentary'; // Create reveal text

  /** Context for generation */
  context: {
    cartridgeId: string;
    cartridgeName: string;
    currentPhase: string;
    relevantFacts?: string[];
    submissions?: Record<string, string>;
    [key: string]: any;
  };

  /** Additional instructions */
  instructions?: string;
}

// ============================================================================
// CARTRIDGE RESULT - What Cartridges Return
// ============================================================================

/**
 * CartridgeResult - Complete record of what happened
 *
 * When a cartridge completes, it returns this result.
 * The game orchestrator uses this to update state and prepare for next turn.
 *
 * IMPORTANT: Not all cartridges involve scoring! Some cartridges are just for:
 * - Information gathering
 * - Group decisions/voting
 * - Entertainment (no points)
 * - Ranking/preference collection
 *
 * Scoring is completely optional and controlled by the cartridge itself.
 */
export interface CartridgeResult {
  /** Did the cartridge complete successfully? */
  completed: boolean;

  /** Complete turn record (with prompt, submissions, optional scoring) - Optional for MVP */
  turnPacket?: TurnPacket;

  /**
   * Score changes per player
   * Empty object {} if this cartridge doesn't award points
   */
  scoreChanges: Record<string, number>;

  /** IDs of moments to highlight in Act 3 */
  highlights?: string[];

  /** Was this cartridge skipped/abandoned? */
  skipped?: boolean;

  /** Why was it skipped? */
  skipReason?: string;
}

// ============================================================================
// CARTRIDGE DEFINITION - The Cartridge Module
// ============================================================================

/**
 * Viewing mode for cartridge screens
 */
export type ViewingMode =
  | 'private' // One player at a time (hold phone close)
  | 'public' // Everyone sees (phone on table)
  | 'pass-around'; // Pass phone around for input

/**
 * CartridgeDefinition - The cartridge module interface
 *
 * Each cartridge exports an object matching this interface.
 * The game loads cartridges dynamically and runs them.
 */
export interface CartridgeDefinition {
  // ===========================================================================
  // METADATA
  // ===========================================================================

  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** Short description (1-2 sentences) */
  description: string;

  /** Emoji/icon for UI */
  icon: string;

  /** Estimated duration (ms) */
  estimatedDuration: number;

  /** Tags for categorization */
  tags: string[];

  // ===========================================================================
  // REQUIREMENTS
  // ===========================================================================

  /**
   * Minimum number of players
   * (e.g., some games need at least 3 players)
   */
  minPlayers: number;

  /**
   * Maximum number of players
   * (e.g., some games don't scale past 6)
   */
  maxPlayers: number;

  /**
   * Required fact categories
   * (e.g., trivia needs 'observational' facts)
   */
  requiredFactCategories?: string[];

  /**
   * Minimum facts needed
   */
  minFacts?: number;

  // ===========================================================================
  // SELECTION LOGIC
  // ===========================================================================

  /**
   * Can this cartridge run right now?
   * Return false if prerequisites aren't met.
   */
  canRun: (context: CartridgeContext) => boolean;

  /**
   * How relevant is this cartridge right now?
   * Return 0-1 score. Used by LLM for selection.
   *
   * Consider:
   * - Available facts
   * - Player count
   * - Recent cartridge history (avoid repetition)
   * - Time remaining
   */
  getRelevanceScore: (context: CartridgeContext) => number;

  // ===========================================================================
  // COMPONENT
  // ===========================================================================

  /**
   * React component that runs the cartridge
   * This component receives context and onComplete callback
   */
  Component: React.ComponentType<CartridgeProps>;
}

/**
 * Props passed to cartridge components
 */
export interface CartridgeProps {
  /** Context from game */
  context: CartridgeContext;

  /** Callback when cartridge completes */
  onComplete: (result: CartridgeResult) => void;

  /** Callback to cancel/exit cartridge */
  onCancel?: () => void;
}

// ============================================================================
// SCORING REVEAL - Exciting Score Presentation (OPTIONAL)
// ============================================================================

/**
 * ScoringRevealData - Data for presenting scores dramatically
 *
 * This is an OPTIONAL utility for cartridges that involve scoring.
 * Many cartridges don't score at all - they might just collect information,
 * facilitate group decisions, or provide entertainment without points.
 *
 * If your cartridge DOES award points, you can use the ScoringReveal
 * component (components/ScoringReveal.tsx) to present results in an
 * exciting way with LLM explanations.
 *
 * Cartridges that use scoring typically:
 * 1. Collect submissions from players
 * 2. Use LLM to evaluate and score them
 * 3. Build ScoringRevealData with explanations
 * 4. Render ScoringReveal component as their final screen
 * 5. Return CartridgeResult with scoreChanges populated
 */
export interface ScoringRevealData {
  /** Reveal mode */
  mode: 'sequential' | 'all-at-once' | 'leaderboard';

  /** Title for reveal screen */
  title: string;

  /** Subtitle (optional) */
  subtitle?: string;

  /** Individual reveals (for sequential mode) */
  reveals: PlayerReveal[];

  /** Overall LLM commentary (shown after all reveals) */
  summary?: string;

  /** Celebration effect for top scorer */
  celebration?: 'confetti' | 'sparkles' | 'fireworks';
}

/**
 * Individual player reveal
 */
export interface PlayerReveal {
  /** Player ID */
  playerId: string;

  /** Their submission/answer */
  answer: string;

  /** Points awarded */
  points: number;

  /** Bonus points? */
  bonus?: number;

  /** LLM explanation of score */
  explanation: string;

  /** Dramatic pause before reveal (ms) */
  suspenseDelay?: number;

  /** Animation type */
  animation?: 'slide-in' | 'fade-in' | 'bounce-in';
}

// ============================================================================
// CARTRIDGE REGISTRY
// ============================================================================

/**
 * CartridgeRegistry - Central registry of all cartridges
 *
 * The game queries this to find available cartridges.
 */
export interface CartridgeRegistry {
  /** All registered cartridges */
  cartridges: Map<string, CartridgeDefinition>;

  /** Register a cartridge */
  register: (cartridge: CartridgeDefinition) => void;

  /** Get cartridge by ID */
  get: (id: string) => CartridgeDefinition | undefined;

  /** Get all runnable cartridges for current context */
  getRunnable: (context: CartridgeContext) => CartridgeDefinition[];

  /** Select best cartridge (using LLM or heuristics) */
  selectNext: (
    context: CartridgeContext,
    useLLM: boolean
  ) => Promise<CartridgeDefinition | null>;
}

// ============================================================================
// CARTRIDGE SELECTION
// ============================================================================

/**
 * CartridgeSelectionRequest - Input for LLM selection
 */
export interface CartridgeSelectionRequest {
  /** Available cartridges */
  candidates: Array<{
    id: string;
    name: string;
    description: string;
    relevanceScore: number;
  }>;

  /** Game context */
  context: {
    playerCount: number;
    factCount: number;
    recentCartridges: string[]; // IDs of last 3 cartridges
    timeRemaining: number;
    currentScores: Record<string, number>;
  };
}

/**
 * CartridgeSelectionResponse - LLM's choice
 */
export interface CartridgeSelectionResponse {
  /** Selected cartridge ID */
  selectedId: string;

  /** Why this cartridge? */
  reasoning: string;

  /** Confidence (0-1) */
  confidence: number;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Cartridge phase - internal state
 * Cartridges can define their own phases
 */
export type CartridgePhase = string; // e.g., 'intro' | 'input' | 'reveal' | 'score'

/**
 * Submission record for cartridge
 */
export interface CartridgeSubmission {
  playerId: string;
  answer: string;
  submittedAt: number;
  metadata?: Record<string, any>;
}
