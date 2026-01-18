/**
 * ============================================================================
 * FAMILY GLITCH - CORE TYPE DEFINITIONS
 * ============================================================================
 *
 * This file contains all TypeScript interfaces and types for the game system.
 * These types form the contract between all game subsystems:
 * - State machine
 * - Event log
 * - LLM integration
 * - UI components
 * - Persistence layer
 *
 * Design principles:
 * - Explicit over implicit (no "magic" values)
 * - Type-safe state transitions
 * - Serializable to JSON (for localStorage)
 * - Immutable state updates (React-friendly)
 */

// ============================================================================
// PLAYER & SETUP
// ============================================================================

/**
 * Player role labels - used for personalization and context
 * These help the LLM generate age-appropriate and context-aware prompts
 */
export type PlayerRole =
  | 'mom'
  | 'dad'
  | 'daughter'
  | 'son'
  | 'brother'
  | 'sister'
  | 'grandma'
  | 'grandpa'
  | 'aunt'
  | 'uncle'
  | 'cousin'
  | 'friend';

/**
 * Player entity - represents a single participant in the game
 */
export interface Player {
  /** Unique identifier (UUID v4) */
  id: string;

  /** Display name - shown throughout the game */
  name: string;

  /** Age in years - used for content appropriateness */
  age: number;

  /** Family role - provides context for LLM prompts */
  role: PlayerRole;

  /** Avatar identifier - maps to icon set (e.g., 'avatar-001') */
  avatarId: string;

  /** Position in turn rotation (0-indexed, assigned at setup) */
  turnOrder: number;

  /** Current cumulative score across all rounds */
  currentScore: number;
}

/**
 * Safety mode determines content boundaries for prompts
 * - kid-safe: Ages 10-12, mild humor, no adult themes
 * - teen-adult: Ages 13+, sophisticated humor, still family-appropriate
 */
export type SafetyMode = 'kid-safe' | 'teen-adult';

/**
 * Game setup configuration - captured during initial setup screen
 * This is immutable once the game starts
 */
export interface GameSetup {
  /** Array of 2-4 players (optimized for 3-4) */
  players: Player[];

  /** Content safety level for the entire session */
  safetyMode: SafetyMode;

  /** How to determine next player - clockwise is default */
  turnOrderStrategy: 'clockwise' | 'random-fair';

  /** Timestamp when setup was completed (ms since epoch) */
  createdAt: number;

  /** Unique session identifier (UUID v4) */
  sessionId: string;
}

// ============================================================================
// STATE MACHINE
// ============================================================================

/**
 * All possible game states - forms a strict state machine
 *
 * State naming convention: {ACT}_{PHASE}_{SUBPHASE}
 * - SETUP: Pre-game player entry
 * - ACT1: Fact gathering (builds knowledge DB)
 * - ACT2: Mini-games using gathered facts
 * - ACT3: Final reveals and scoring
 * - END: Post-game summary
 *
 * Transitions are validated in the state machine module
 */
export type GameStateType =
  | 'SETUP' // Player configuration screen
  | 'ACT1_FACT_PROMPT_PRIVATE' // Show private fact-gathering question
  | 'ACT1_FACT_CONFIRM' // Brief confirmation after fact submission
  | 'ACT1_TRANSITION' // Transition screen from Act 1 → Act 2
  | 'ACT2_CARTRIDGE_ACTIVE' // Active cartridge (mini-game) running
  | 'ACT2_TRANSITION' // Transition screen from Act 2 → Act 3
  | 'ACT3_FINAL_REVEAL' // Reveal previously hidden facts
  | 'ACT3_HIGHLIGHTS' // Show session highlights (funniest, cleverest)
  | 'ACT3_TALLY' // Final scoreboard and winner declaration
  | 'END'; // Game over, option to replay

/**
 * Act number - the game is divided into three major acts
 */
export type ActNumber = 1 | 2 | 3;

/**
 * Core game state - tracks current position in the state machine
 * This is the "single source of truth" for where we are in the game
 */
export interface GameState {
  /** Current state in the state machine */
  currentState: GameStateType;

  /** Which act we're in (1, 2, or 3) */
  currentAct: ActNumber;

  /** Who is currently holding the phone (null during group screens) */
  activePlayerId: string | null;

  /** Who should receive the phone next (pre-calculated for smooth handoffs) */
  nextPlayerId: string | null;

  // -------------------------------------------------------------------------
  // Progress tracking
  // -------------------------------------------------------------------------

  /** When the game started (ms since epoch) - used for pacing calculations */
  startTime: number;

  /** Target session length in milliseconds (default: 10-15 min) */
  targetDurationMs: number;

  /** When Act 1 ended (null if still in Act 1) */
  act1CompleteTime: number | null;

  /** When Act 2 ended (null if still in Act 2 or earlier) */
  act2CompleteTime: number | null;

  // -------------------------------------------------------------------------
  // Turn fairness tracking
  // -------------------------------------------------------------------------

  /**
   * Map of playerId → number of turns taken
   * Used to ensure fair distribution (max difference of 1 turn)
   *
   * Example: { "player-123": 3, "player-456": 2, "player-789": 3 }
   */
  turnCounts: Record<string, number>;

  // -------------------------------------------------------------------------
  // Current cartridge context (Act 2 only)
  // -------------------------------------------------------------------------

  /** ID of the currently active cartridge (e.g., "new-yorker-caption") */
  activeCartridgeId: string | null;

  /** Unique ID for this specific round (allows multiple plays of same cartridge) */
  cartridgeInstanceId: string | null;

  // -------------------------------------------------------------------------
  // Metadata
  // -------------------------------------------------------------------------

  /** Session identifier (matches GameSetup.sessionId) */
  sessionId: string;

  /** Timestamp of last state update (for staleness detection) */
  lastUpdated: number;
}

// ============================================================================
// EVENT LOG
// ============================================================================

/**
 * Event types - each represents a distinct game action
 * The event log is append-only and forms a complete audit trail
 */
export type EventType =
  | 'STATE_TRANSITION' // State machine moved from one state to another
  | 'PROMPT_SHOWN' // LLM-generated prompt displayed to player
  | 'ANSWER_SUBMITTED' // Player submitted an answer
  | 'SCORE_AWARDED' // Points given to a player
  | 'FACT_STORED' // New fact added to knowledge DB
  | 'CARTRIDGE_STARTED' // Mini-game round began
  | 'CARTRIDGE_COMPLETED' // Mini-game round finished
  | 'ACT_TRANSITION' // Moved from one act to another
  | 'TURN_PASSED'; // Phone passed to next player

/**
 * Base event properties - included in all event types
 */
export interface BaseEvent {
  /** Unique event ID (UUID v4) */
  id: string;

  /** Event type discriminator */
  type: EventType;

  /** When this event occurred (ms since epoch) */
  timestamp: number;

  /** Which act the event occurred in */
  actNumber: ActNumber;

  /** Who was holding the phone when event occurred (null for group events) */
  activePlayerId: string | null;
}

/**
 * State transition event - tracks movement through the state machine
 * Critical for debugging state flow and calculating session analytics
 */
export interface StateTransitionEvent extends BaseEvent {
  type: 'STATE_TRANSITION';

  /** Previous state */
  stateFrom: GameStateType;

  /** New state */
  stateTo: GameStateType;
}

/**
 * Prompt shown event - records what question/content was presented
 */
export interface PromptShownEvent extends BaseEvent {
  type: 'PROMPT_SHOWN';

  /** Unique prompt identifier (for deduplication) */
  promptId: string;

  /** Which cartridge generated this prompt (null for Act 1) */
  cartridgeId: string | null;

  /** The actual prompt text shown to the player */
  content: string;

  /** How the prompt was presented */
  modality: 'text' | 'image' | 'ascii';

  /** Whether this was shown privately or to the group */
  visibility: 'private' | 'public';
}

/**
 * Answer submitted event - records player responses
 */
export interface AnswerSubmittedEvent extends BaseEvent {
  type: 'ANSWER_SUBMITTED';

  /** Which prompt this answers */
  promptId: string;

  /** The player's answer (structured based on input module type) */
  answer: AnswerValue;

  /** Whether answer was private or public */
  visibility: 'private' | 'public';

  /** Whether the time limit expired (true if timed out) */
  timedOut: boolean;
}

/**
 * Score awarded event - records points given to a player
 */
export interface ScoreAwardedEvent extends BaseEvent {
  type: 'SCORE_AWARDED';

  /** Who received the points */
  playerId: string;

  /** How many points (0-5 normally, +5 for rare bonuses) */
  points: number;

  /** Why points were awarded (e.g., "Clever caption", "Correct answer") */
  reason: string;

  /** What aspect was being scored */
  scoringDimension: 'correctness' | 'cleverness' | 'humor' | 'bonus';

  /** Who awarded the points (playerId, 'group', or 'auto') */
  judgedBy: string | 'group' | 'auto';

  /** Which cartridge round this score belongs to (null for Act 1) */
  cartridgeInstanceId: string | null;
}

/**
 * Fact stored event - records additions to the knowledge DB
 */
export interface FactStoredEvent extends BaseEvent {
  type: 'FACT_STORED';

  /** Unique fact identifier */
  factId: string;

  /** The complete fact card */
  fact: FactCard;
}

/**
 * Union type of all possible events
 * TypeScript discriminated union allows type-safe event handling
 */
export type GameEvent =
  | StateTransitionEvent
  | PromptShownEvent
  | AnswerSubmittedEvent
  | ScoreAwardedEvent
  | FactStoredEvent
  | BaseEvent; // Fallback for other event types

/**
 * Event log - append-only array of all events
 * Never mutate this directly - always append new events
 */
export interface EventLog {
  /** Session identifier (matches GameState.sessionId) */
  sessionId: string;

  /** Chronologically ordered array of events */
  events: GameEvent[];
}

// ============================================================================
// FACT CARDS (Act 1 output)
// ============================================================================

/**
 * Fact categories - helps the LLM generate diverse prompts
 * Also used to filter facts when selecting relevant context for cartridges
 */
export type FactCategory =
  | 'observational' // About current environment/situation
  | 'preference' // Likes, dislikes, favorites
  | 'behavioral' // How someone acts or reacts
  | 'reasoning' // Logical thinking patterns
  | 'hypothetical' // "What if" scenarios
  | 'estimation' // Fermi-style reasoning
  | 'values'; // What matters to them

/**
 * Privacy level - controls when facts are revealed
 * - private-until-act3: Hidden during gameplay, revealed at end (creates suspense)
 * - reveal-immediately: Shown right away (for lighter facts)
 */
export type PrivacyLevel = 'private-until-act3' | 'reveal-immediately';

/**
 * Fact card - a single piece of knowledge gathered in Act 1
 * These form the "trivia database" used by Act 2 cartridges
 */
export interface FactCard {
  /** Unique fact identifier (UUID v4) */
  id: string;

  /** Who this fact is about ('group' for collective facts) */
  targetPlayerId: string | 'group';

  /** Who provided this information */
  authorPlayerId: string;

  /** Category for filtering and variety */
  category: FactCategory;

  /** The question that was asked */
  question: string;

  /** The answer provided */
  answer: string;

  /** When to reveal this fact */
  privacyLevel: PrivacyLevel;

  /** When fact was created (ms since epoch) */
  createdAt: number;

  /** When fact was revealed (null if not yet revealed) */
  revealedAt: number | null;
}

/**
 * Facts database - organized collection of fact cards
 * Includes indexes for fast lookup by player and category
 */
export interface FactsDB {
  /** All fact cards in chronological order */
  facts: FactCard[];

  /** Index: playerId → array of fact IDs about that player */
  byPlayer: Record<string, string[]>;

  /** Index: category → array of fact IDs in that category */
  byCategory: Record<FactCategory, string[]>;
}

// ============================================================================
// CARTRIDGES (Mini-game plugins)
// ============================================================================

/**
 * Input module types - determines how players provide answers
 * Each type corresponds to a React component in components/input-modules/
 */
export type InputModuleType =
  | 'textarea' // Multi-line text entry
  | 'input-field' // Single-line text entry
  | 'timed-input' // Text entry with countdown timer
  | 'multiple-choice' // Select one option from 2-6 choices
  | 'word-checkbox-grid'; // Select multiple words from a grid

/**
 * Scoring modes - determines how points are awarded
 * - judge: One player acts as judge (selected by game)
 * - group-vote: All non-active players vote
 * - auto: Automatic scoring based on correctness (e.g., word grid)
 * - llm-score: LLM evaluates and scores independently
 *
 * IMPORTANT: Players can NEVER score their own answers
 */
export type ScoringMode = 'judge' | 'group-vote' | 'auto' | 'llm-score';

/**
 * Modality - how content is presented to players
 */
export type Modality = 'text' | 'image' | 'ascii';

/**
 * Cartridge definition - blueprint for a mini-game
 * This is a static configuration; instances are tracked in GameState
 */
export interface CartridgeDefinition {
  /** Unique cartridge identifier (kebab-case, e.g., "new-yorker-caption") */
  id: string;

  /** Display name shown to players */
  name: string;

  /** Brief description for selection logic */
  description: string;

  /** Which acts this cartridge can be used in (usually just [2]) */
  actEligible: ActNumber[];

  /** Which input module to use */
  inputModuleType: InputModuleType;

  /** Whether answers are private or public initially */
  visibility: 'private' | 'public';

  /** How scoring works for this cartridge */
  scoringMode: ScoringMode;

  /** What data this cartridge needs to function */
  dataDependencies: {
    /** Does this need facts from the DB? */
    requiresFactsDB: boolean;

    /** Does this need a word bank? */
    requiresWordBank: boolean;

    /** Minimum number of facts needed */
    minFacts?: number;

    /** Preferred fact categories (optional) */
    preferredCategories?: FactCategory[];
  };

  /** How content is presented */
  modality: Modality;
}

/**
 * Cartridge context - runtime data provided to the LLM for cartridge execution
 * This is the "bag of stuff" the LLM needs to generate a good round
 */
export interface CartridgeContext {
  /** Which cartridge is being executed */
  cartridgeId: string;

  /** Current act number */
  currentAct: ActNumber;

  /** All players in the game */
  players: Player[];

  /** Current scores (playerId → points) */
  scores: Record<string, number>;

  /** How much time is left in the session (ms) */
  timeRemainingMs: number;

  /** Relevant facts from the DB (pre-filtered by category if needed) */
  relevantFacts: FactCard[];

  /** Content safety mode */
  safetyMode: SafetyMode;
}

// ============================================================================
// INPUT MODULES
// ============================================================================

/**
 * Base properties for all input modules
 */
export interface BaseInputModule {
  /** Module type discriminator */
  type: InputModuleType;

  /** Whether this input should be kept private from others */
  privateMode: boolean;
}

/**
 * Textarea input module - multi-line text entry
 */
export interface TextAreaModule extends BaseInputModule {
  type: 'textarea';
  placeholder: string;
  maxLength: number;
  minLength?: number;
}

/**
 * Input field module - single-line text entry
 */
export interface InputFieldModule extends BaseInputModule {
  type: 'input-field';
  placeholder: string;
  maxLength: number;
  validationPattern?: string; // Regex pattern
}

/**
 * Timed input module - text entry with countdown
 */
export interface TimedInputModule extends BaseInputModule {
  type: 'timed-input';

  /** Which base input to use (textarea or input-field) */
  baseModule: 'textarea' | 'input-field';

  /** Time limit in seconds */
  timeLimitSec: number;

  placeholder: string;
  maxLength: number;
}

/**
 * Multiple choice module - select one option
 */
export interface MultipleChoiceModule extends BaseInputModule {
  type: 'multiple-choice';

  /** Array of 2-6 options */
  options: Array<{
    id: string;
    text: string;
  }>;

  minOptions: 2;
  maxOptions: 6;
}

/**
 * Word checkbox grid module - select multiple words
 */
export interface WordCheckboxGridModule extends BaseInputModule {
  type: 'word-checkbox-grid';

  /** Array of 8-20 words */
  words: Array<{
    id: string;
    text: string;

    /** For auto-scoring: is this word correct? */
    correct?: boolean;
  }>;

  minWords: 8;
  maxWords: 20;

  /** Whether to score based on correctness (+1, -1, 0) */
  correctnessScoring: boolean;
}

/**
 * Union type of all input modules
 */
export type InputModule =
  | TextAreaModule
  | InputFieldModule
  | TimedInputModule
  | MultipleChoiceModule
  | WordCheckboxGridModule;

/**
 * Input result - what the input module returns after submission
 */
export interface InputResult {
  /** Which module type produced this result */
  type: InputModuleType;

  /** The actual answer value (structure varies by module) */
  value: AnswerValue;

  /** Metadata about the input process */
  meta: {
    /** Did the timer expire? (only for timed-input) */
    timedOut?: boolean;

    /** How long the player took (ms) */
    timeSpentMs?: number;

    /** Did the answer pass validation? */
    validationPassed: boolean;
  };
}

/**
 * Answer value - flexible type to handle different input formats
 * - string: For text inputs
 * - string[]: For checkbox grids (selected word IDs)
 * - object: For structured data like multiple choice
 */
export type AnswerValue =
  | string
  | string[]
  | { selectedIds: string[] };

// ============================================================================
// SCORING
// ============================================================================

/**
 * Scoring dimensions - what aspect is being evaluated
 */
export type ScoringDimension = 'correctness' | 'cleverness' | 'humor' | 'bonus';

/**
 * Scoring configuration - tells UI how to collect scores
 */
export interface ScoringConfig {
  /** How scoring works (judge, group, or automatic) */
  mode: ScoringMode;

  /** Text guidance for judges (e.g., "Rate how funny the caption is") */
  rubric: string;

  /**
   * Who participates in scoring
   * - 'all': Everyone votes
   * - 'all-except-active': Everyone except the person being scored
   * - specific playerId: One designated judge
   */
  whoVotes: 'all' | 'all-except-active' | string;

  /** Which dimensions to score (usually 1-2, not all 4) */
  dimensions: ScoringDimension[];

  /** Whether to show the +5 bonus button (rare, use sparingly) */
  allowBonus: boolean;
}

/**
 * Score input - a single scoring action from a judge
 */
export interface ScoreInput {
  /** Who is receiving the score */
  playerId: string;

  /** What dimension is being scored */
  dimension: ScoringDimension;

  /** Points awarded (0-5, or +5 for bonus) */
  points: number;

  /** Who gave this score */
  judgedBy: string | 'group';
}

/**
 * Score event - recorded in the event log
 */
export interface ScoreEvent {
  /** Unique event ID */
  id: string;

  /** Who received points */
  playerId: string;

  /** How many points */
  points: number;

  /** Why they got points */
  reason: string;

  /** Which dimension */
  dimension: ScoringDimension;

  /** Who judged */
  judgedBy: string | 'group' | 'auto';

  /** Which cartridge round (null for Act 1) */
  cartridgeInstanceId: string | null;

  /** When this happened */
  timestamp: number;
}

// ============================================================================
// LLM CONTRACT
// ============================================================================

/**
 * LLM request - what we send to OpenAI
 * This is a compacted, focused slice of game state
 */
export interface LLMRequest {
  /** Current session ID */
  sessionId: string;

  /** Where we are in the state machine */
  currentState: GameStateType;

  /** Which act */
  currentAct: ActNumber;

  /** All players */
  players: Player[];

  /** Who is active */
  activePlayerId: string | null;

  // -------------------------------------------------------------------------
  // Compacted context (not the full event log)
  // -------------------------------------------------------------------------

  /** Last N events (typically 5-10) */
  recentEvents: GameEvent[];

  /** Relevant facts (pre-filtered by category if in a cartridge) */
  factsDB: FactCard[];

  /** Current scoreboard */
  currentScores: Record<string, number>;

  // -------------------------------------------------------------------------
  // Progress information
  // -------------------------------------------------------------------------

  /** How long the game has been running (ms) */
  timeElapsedMs: number;

  /** Target session length (ms) */
  targetDurationMs: number;

  /** How many facts gathered in Act 1 */
  act1FactCount: number;

  /** How many cartridge rounds completed in Act 2 */
  act2RoundsCompleted: number;

  // -------------------------------------------------------------------------
  // Request type - tells LLM what to generate
  // -------------------------------------------------------------------------

  /**
   * What we're asking the LLM to do:
   * - next-prompt: Generate next fact-gathering question (Act 1)
   * - select-cartridge: Choose and intro a cartridge (Act 2)
   * - generate-reveal: Format a reveal for a submitted answer
   * - suggest-scoring: Provide scoring guidance for judges
   * - act-transition: Generate transition screen between acts
   */
  requestType:
    | 'next-prompt'
    | 'select-cartridge'
    | 'generate-reveal'
    | 'suggest-scoring'
    | 'act-transition';

  /** Content safety mode */
  safetyMode: SafetyMode;

  // -------------------------------------------------------------------------
  // Optional context (varies by request type)
  // -------------------------------------------------------------------------

  /** The most recent answer (for generate-reveal requests) */
  lastAnswer?: AnswerValue;

  /** Cartridge context (for select-cartridge requests) */
  cartridgeContext?: CartridgeContext;
}

/**
 * LLM response - strict JSON schema enforced by OpenAI function calling
 * This is the ONLY format the LLM is allowed to return
 */
export interface LLMResponse {
  /** What state to transition to after this */
  nextState: GameStateType;

  /** Content to show on screen */
  screen: {
    /** Screen title (max 60 chars) */
    title: string;

    /** Main content (max 500 chars) */
    body: string;

    /** How to present the content */
    modality: Modality;

    /** Whether this screen should be private */
    private: boolean;

    /** Instructions for the player (e.g., "Answer privately, then tap Done") */
    instructions: string;

    /** If modality is 'image', this is the DALL-E prompt */
    imagePrompt?: string;
  };

  /** Which input module to show (null for non-input screens) */
  inputModule: InputModule | null;

  /** How to format the reveal (optional, for reveal screens) */
  reveal?: {
    /** Template with placeholders like {{answer}}, {{playerName}} */
    template: string;

    /** Format style */
    format: 'text' | 'comparison' | 'list';
  };

  /** Scoring configuration (optional, for scoring screens) */
  scoring?: ScoringConfig;

  /** Facts to store in DB (optional, for Act 1 prompts) */
  factsToStore?: Array<{
    targetPlayerId: string;
    category: FactCategory;
    question: string;
    answer: string;
    privacyLevel: PrivacyLevel;
  }>;

  /** Safety checks performed by LLM */
  safetyFlags: {
    /** Is content appropriate for the safety mode? */
    contentAppropriate: boolean;

    /** Is content appropriate for player ages? */
    ageAppropriate: boolean;

    /** Warning message if flags are false */
    warningMessage?: string;
  };

  /** Metadata for game engine */
  meta: {
    /** Which cartridge was selected (for select-cartridge requests) */
    cartridgeId?: string;

    /** Should we end the current act? */
    shouldEndAct?: boolean;

    /** Suggested next active player */
    suggestedNextActivePlayerId?: string;
  };
}

// ============================================================================
// PERSISTENCE
// ============================================================================

/**
 * Persisted session - the complete game state stored in localStorage
 * This single object contains everything needed to resume a game
 */
export interface PersistedSession {
  /** Game configuration (immutable after setup) */
  setup: GameSetup;

  /** Current game state */
  state: GameState;

  /** Complete event log */
  eventLog: EventLog;

  /** Facts database */
  factsDB: FactsDB;

  /**
   * Turn packet store (unified turn lifecycle data)
   *
   * This is the new structured way to store turn data.
   * It coexists with eventLog for backward compatibility,
   * but provides richer context for rendering and scoring.
   */
  turnPacketStore?: import('./turnPacket').TurnPacketStore;

  /** Current scores (denormalized for quick access) */
  scores: Record<string, number>;

  /** Schema version (for future migrations) */
  version: string;

  /** When this was last saved to localStorage */
  lastSaved: number;
}
