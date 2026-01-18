/**
 * ============================================================================
 * TURN PACKET - Unified Turn Lifecycle Data
 * ============================================================================
 *
 * This module defines the TurnPacket data structure - a single object that
 * captures everything about a turn:
 * - What was shown (the prompt/artifact)
 * - Why it was chosen (relevance metadata)
 * - How players interacted with it (submissions)
 * - How it was scored (scoring record)
 *
 * Key benefits:
 * - Re-render any turn for Act 3 reveals
 * - Explain selection reasoning to players
 * - Reproduce LLM outputs (we store the generation request)
 * - Enable LLM-assisted scoring (with full context)
 * - Support session replay and debugging
 *
 * Design principles:
 * - Self-contained (all context for one turn)
 * - Immutable once created (append-only)
 * - Serializable (localStorage-friendly)
 * - Future-proof (supports images, audio, etc.)
 */

import {
  ActNumber,
  FactCategory,
  ScoringDimension,
  SafetyMode,
  Modality,
  AnswerValue,
} from './game';

// ============================================================================
// PROMPT ARTIFACT - What Was Shown & How It Was Generated
// ============================================================================

/**
 * Generation metadata - how content was created
 *
 * Stores enough info to reproduce or explain the generation
 */
export interface GenerationMeta {
  /** AI provider used */
  provider: 'openai' | 'anthropic' | 'manual';

  /** Model name (e.g., 'gpt-4o-mini', 'dall-e-3') */
  model?: string;

  /** Exact prompt sent to generate the content */
  promptText: string;

  /** Generation seed (if supported, for reproducibility) */
  seed?: string;

  /** Temperature/creativity setting */
  temperature?: number;

  /** Safety mode applied during generation */
  safetyMode: SafetyMode;

  /** Timestamp of generation */
  generatedAt: number;
}

/**
 * Image output data
 *
 * For image-based cartridges (e.g., caption contest)
 *
 * Storage strategy:
 * - MVP: dataUrl (base64, simple but larger)
 * - Future: blobKey (IndexedDB reference, better for many images)
 */
export interface ImageOutput {
  /** Base64 data URL (data:image/png;base64,...) */
  dataUrl?: string;

  /** Blob key for IndexedDB lookup (future enhancement) */
  blobKey?: string;

  /** MIME type */
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';

  /** Dimensions (if known) */
  width?: number;
  height?: number;

  /** Alt text for accessibility / LLM context */
  altText?: string;

  /** Keywords for LLM scoring context (if image not included) */
  keywords?: string[];
}

/**
 * Content output - what was actually shown to players
 */
export interface ContentOutput {
  /** Text content (for text/ascii modalities) */
  text?: string;

  /** Image data (for image modality) */
  image?: ImageOutput;

  /** Short machine-readable summary (for LLM context compression) */
  summary?: {
    /** One sentence description */
    short: string;

    /** Keywords for filtering/search */
    keywords: string[];
  };
}

/**
 * PromptArtifact - Complete record of what was shown
 *
 * This is the "canonical truth" for a prompt. It includes:
 * - How it was generated (reproducibility)
 * - What was shown (for re-rendering)
 * - Context for LLM scoring (if needed)
 */
export interface PromptArtifact {
  /** Unique artifact ID */
  id: string;

  /** How content is presented */
  modality: Modality;

  /** Display title (optional) */
  title?: string;

  /** How this content was generated */
  generation: GenerationMeta;

  /** The actual output shown to players */
  output: ContentOutput;
}

// ============================================================================
// RELEVANCE META - Why This Was Chosen
// ============================================================================

/**
 * Dependencies used in selection
 *
 * Tracks what data influenced the choice of this prompt
 */
export interface SelectionDependencies {
  /** Fact card IDs this prompt relies on */
  factCardIds?: string[];

  /** Prior turn IDs referenced (callbacks, running jokes) */
  priorTurnIds?: string[];

  /** Players specifically targeted by this prompt */
  playerTargeting?: string[];
}

/**
 * Expected signal - what this turn is meant to measure
 *
 * Helps LLM and judges understand scoring intent
 */
export interface ExpectedSignal {
  /** What dimensions this turn scores */
  dimensions: ScoringDimension[];

  /** Scoring guidance for judges */
  rubricHint: string;
}

/**
 * RelevanceMeta - Explains why this prompt was chosen
 *
 * This is the "breadcrumb trail" that prevents the game from feeling random.
 * It documents the selection logic so players understand the flow.
 */
export interface RelevanceMeta {
  /** Human-readable selection reason */
  selectionReason: string;

  /** Tags for categorization */
  tags: string[];

  /** What data this prompt depends on */
  dependenciesUsed: SelectionDependencies;

  /** What we expect to measure */
  expectedSignal: ExpectedSignal;
}

// ============================================================================
// TURN RULES - How To Play This Turn
// ============================================================================

/**
 * Visibility modes for turn content
 */
export type TurnVisibility = 'private' | 'public' | 'mixed';

/**
 * Input module configuration for this turn
 */
export interface TurnInputConfig {
  /** Which input module to use */
  type: 'textarea' | 'input-field' | 'timed-input' | 'multiple-choice' | 'word-checkbox-grid';

  /** Time limit in seconds (optional) */
  timeLimitSec?: number;

  /** Character limit (for text inputs) */
  charLimit?: number;

  /** Options (for multiple choice) */
  options?: Array<{ id: string; label: string }>;

  /** Words (for checkbox grid) */
  wordGrid?: Array<{ id: string; word: string; correct?: boolean }>;
}

/**
 * Scoring configuration for this turn
 */
export interface TurnScoringConfig {
  /**
   * How scoring works:
   * - judge: One designated player judges (human decision)
   * - group-vote: All non-active players vote (human consensus)
   * - auto: Automatic rule-based scoring (e.g., word grid correctness)
   * - llm-score: LLM scores independently (no human input)
   *
   * NOTE: Players can NEVER score their own answers
   */
  mode: 'judge' | 'group-vote' | 'auto' | 'llm-score';

  /** What dimensions to score */
  dimensions: ScoringDimension[];

  /** Maximum base points */
  maxPoints: number;

  /** Whether +5 bonus is allowed */
  bonusAllowed?: boolean;

  /** Judge player ID (if mode = 'judge') */
  judgePlayerId?: string;
}

/**
 * Optional constraints on answers
 */
export interface TurnConstraints {
  /** Must reference a specific fact? */
  mustReferenceFact?: boolean;

  /** Topics to avoid */
  forbiddenTopics?: string[];

  /** Minimum/maximum answer length */
  lengthRange?: { min: number; max: number };
}

/**
 * TurnRules - Complete ruleset for how this turn works
 *
 * Defines input method, visibility, and scoring approach
 */
export interface TurnRules {
  /** Input configuration */
  inputModule: TurnInputConfig;

  /** Who can see what */
  visibility: TurnVisibility;

  /** How to score */
  scoring: TurnScoringConfig;

  /** Optional constraints */
  constraints?: TurnConstraints;
}

// ============================================================================
// SUBMISSIONS - Player Responses
// ============================================================================

/**
 * Single player submission for a turn
 */
export interface Submission {
  /** Unique submission ID */
  id: string;

  /** Who submitted this */
  playerId: string;

  /** Which prompt this answers */
  promptId: string;

  /** Visibility of this submission */
  visibility: TurnVisibility;

  /** The actual answer (structure varies by input module) */
  value: AnswerValue;

  /** When submitted */
  createdAt: number;

  /** Did the timer expire? */
  timedOut?: boolean;

  /** Time spent on input (ms) */
  timeSpentMs?: number;
}

// ============================================================================
// SCORING RECORD - How It Was Judged
// ============================================================================

/**
 * Single scoring entry (one player's scores)
 */
export interface ScoreEntry {
  /** Who is being scored */
  playerId: string;

  /** Scores by dimension (0-5 per dimension) */
  scores: Partial<Record<ScoringDimension, number>>;

  /** Bonus points (0 or 5) */
  bonus?: number;

  /** Optional reasoning note */
  reason?: string;

  /** Who judged this (player IDs or 'llm') */
  judgedBy: string[];
}

/**
 * ScoringRecord - Complete scoring results for a turn
 */
export interface ScoringRecord {
  /** When scoring was completed */
  scoredAt: number;

  /** Scoring mode used */
  mode: 'judge' | 'group-vote' | 'auto' | 'llm-score';

  /** Individual score entries */
  entries: ScoreEntry[];

  /**
   * LLM analysis (if llm-score mode)
   *
   * When mode is 'llm-score', the LLM independently evaluates and scores.
   * This field documents its reasoning for transparency.
   */
  llmAnalysis?: {
    /** LLM's reasoning for scores given */
    reasoning: string;

    /** Confidence level (0-1) */
    confidence?: number;

    /** Which prompt/context was used for scoring */
    promptUsed?: string;
  };
}

// ============================================================================
// REVEAL META - How To Show Results
// ============================================================================

/**
 * Reveal format options
 */
export type RevealFormat = 'text' | 'comparison' | 'list' | 'carousel' | 'side-by-side';

/**
 * RevealMeta - Instructions for formatting reveals
 *
 * Used in Act 2 public reveals and Act 3 recaps
 */
export interface RevealMeta {
  /** How to format the reveal */
  format: RevealFormat;

  /** Template with placeholders ({{answer}}, {{playerName}}, etc.) */
  template: string;

  /** Whether to reveal gradually (animation) */
  animated?: boolean;

  /** Highlight style (for standout moments) */
  highlightStyle?: 'winner' | 'funny' | 'clever' | 'surprising';
}

// ============================================================================
// TURN PACKET - The Complete Turn Object
// ============================================================================

/**
 * TurnPacket - Single object capturing an entire turn lifecycle
 *
 * This is the "unit of gameplay" - everything about one turn is bundled here.
 *
 * Benefits:
 * - Easy to re-render any turn later (Act 3 reveals)
 * - Complete context for LLM scoring
 * - Clear audit trail for debugging
 * - Enables session replay
 *
 * Storage:
 * - Saved to localStorage (or IndexedDB for large sessions)
 * - Referenced by ID in event log
 * - Immutable once created (append-only updates)
 */
export interface TurnPacket {
  // -------------------------------------------------------------------------
  // Identity
  // -------------------------------------------------------------------------

  /** Unique turn ID (UUID v4) */
  id: string;

  /** When this turn was created */
  createdAt: number;

  /** Which act (1, 2, or 3) */
  act: ActNumber;

  /** Round index within the act (0-indexed) */
  roundIndex: number;

  /** Global turn index across entire session (0-indexed) */
  turnIndex: number;

  /** Which cartridge generated this turn */
  cartridgeId: string;

  // -------------------------------------------------------------------------
  // Players
  // -------------------------------------------------------------------------

  /** Who is actively playing this turn */
  activePlayerId: string;

  /** Optional: players this turn is about (for targeted prompts) */
  targetPlayerIds?: string[];

  // -------------------------------------------------------------------------
  // Content
  // -------------------------------------------------------------------------

  /** What the player saw */
  prompt: PromptArtifact;

  /** Why this prompt was chosen */
  relevance: RelevanceMeta;

  /** How this turn works (input, scoring rules) */
  rules: TurnRules;

  // -------------------------------------------------------------------------
  // Interaction
  // -------------------------------------------------------------------------

  /** Player submissions (answers) */
  submissions: Submission[];

  /** Scoring results (null if not yet scored) */
  scoring: ScoringRecord | null;

  /** Reveal formatting instructions */
  reveal: RevealMeta;

  // -------------------------------------------------------------------------
  // Metadata
  // -------------------------------------------------------------------------

  /** Tags for Act 3 highlights (e.g., ['funniest', 'comeback']) */
  highlightTags?: string[];

  /** Notes for debugging/admin */
  notes?: string;
}

// ============================================================================
// TURN PACKET STORE - Collection Management
// ============================================================================

/**
 * TurnPacketStore - Organized collection of all turns in a session
 *
 * Provides indexed access for efficient queries
 */
export interface TurnPacketStore {
  /** All turn packets in chronological order */
  packets: TurnPacket[];

  /** Index by turn ID for fast lookup */
  byId: Record<string, TurnPacket>;

  /** Index by act for filtered access */
  byAct: Record<ActNumber, string[]>;

  /** Index by cartridge ID */
  byCartridge: Record<string, string[]>;

  /** Index by active player ID */
  byPlayer: Record<string, string[]>;

  /** Index by highlight tags (for Act 3 selection) */
  byHighlight: Record<string, string[]>;
}
