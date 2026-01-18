/**
 * ============================================================================
 * GAME CONSTANTS - Single Source of Truth for Configuration
 * ============================================================================
 *
 * This file contains all tunable parameters for Family Glitch. Change values
 * here to adjust game balance, timing, scoring, and behavior.
 *
 * Design philosophy:
 * - Make the invisible visible (every magic number lives here)
 * - Easy to experiment (change one number, test the impact)
 * - Future-proof (include fields for features we haven't built yet)
 * - Well-documented (explain WHY each value is what it is)
 */

// ============================================================================
// TIMING & PACING
// ============================================================================

/**
 * Session duration configuration
 *
 * These control how long a typical game lasts. The pacing system uses these
 * to decide when to transition between acts.
 *
 * Future enhancement: Could support difficulty modes (Quick/Normal/Epic)
 */
export const TIMING = {
  /** Target session duration in milliseconds (default: 15 minutes) */
  TARGET_DURATION_MS: 15 * 60 * 1000,

  /** Minimum session duration (prevents game from ending too quickly) */
  MIN_DURATION_MS: 8 * 60 * 1000,

  /** Maximum session duration (prevents dragging on too long) */
  MAX_DURATION_MS: 20 * 60 * 1000,

  /** Act 1 should end around this percentage of total time */
  ACT1_TARGET_PERCENT: 0.25, // 25% of session = ~3-4 minutes

  /** Act 2 should end around this percentage of total time */
  ACT2_TARGET_PERCENT: 0.80, // 80% of session = ~12 minutes

  /** Act 3 takes the remaining time */
  ACT3_TARGET_PERCENT: 0.95, // Leave 5% buffer for final screens

  /** Average time per Act 1 fact-gathering round (seconds) */
  AVG_ACT1_ROUND_SEC: 45,

  /** Average time per Act 2 cartridge round (seconds) */
  AVG_ACT2_ROUND_SEC: 90,

  /** Average time per Act 3 reveal (seconds) */
  AVG_ACT3_REVEAL_SEC: 15,

  // Future: Could add per-cartridge time estimates
  // CARTRIDGE_TIME_ESTIMATES: { 'new-yorker-caption': 120, ... }
} as const;

// ============================================================================
// PLAYER CONFIGURATION
// ============================================================================

/**
 * Player count and setup rules
 */
export const PLAYERS = {
  /** Minimum number of players */
  MIN_COUNT: 2,

  /** Maximum number of players */
  MAX_COUNT: 4,

  /** Recommended player count (optimized for this) */
  RECOMMENDED_COUNT: 3,

  /** Minimum age for kid-safe mode */
  MIN_AGE_KID_SAFE: 10,

  /** Minimum age for teen-adult mode */
  MIN_AGE_TEEN_ADULT: 13,

  /** Default avatar IDs (index 0-19) */
  AVAILABLE_AVATARS: Array.from({ length: 20 }, (_, i) => `avatar-${String(i).padStart(3, '0')}`),

  // Future: Could support teams, spectators, etc.
  // MAX_TEAMS: 2,
  // ALLOW_SPECTATORS: false,
} as const;

// ============================================================================
// ACT 1 - FACT GATHERING
// ============================================================================

/**
 * Act 1 configuration - building the knowledge database
 */
export const ACT1 = {
  /** Minimum facts needed before Act 2 can start */
  MIN_FACTS: 8,

  /** Target facts per player (used to calculate ideal total) */
  TARGET_FACTS_PER_PLAYER: 2.5,

  /** Maximum facts to gather (prevents Act 1 from dragging on) */
  MAX_FACTS: 20,

  /** Fact category distribution weights (higher = more common) */
  CATEGORY_WEIGHTS: {
    observational: 2.0, // Emphasize present-moment awareness
    preference: 1.5,
    behavioral: 1.5,
    reasoning: 1.0,
    hypothetical: 1.0,
    estimation: 0.5, // Rare - requires math thinking
    values: 1.0,
  },

  /** Privacy level distribution (what % should be hidden until Act 3) */
  PRIVATE_UNTIL_ACT3_PERCENT: 0.6, // 60% hidden, 40% revealed immediately

  /** Time limit per fact input (optional, 0 = no limit) */
  INPUT_TIME_LIMIT_SEC: 0, // Disabled in Act 1 to avoid pressure

  // Future: Adaptive difficulty
  // ADAPTIVE_DIFFICULTY: true,
  // EASY_MODE_FACTS: 6,
  // HARD_MODE_FACTS: 15,
} as const;

// ============================================================================
// ACT 2 - CARTRIDGES / MINI-GAMES
// ============================================================================

/**
 * Act 2 configuration - the main gameplay loop
 */
export const ACT2 = {
  /** Minimum cartridge rounds before Act 3 can start */
  MIN_ROUNDS: 2,

  /** Target number of cartridge rounds (varies by time remaining) */
  TARGET_ROUNDS: 5,

  /** Maximum cartridge rounds (cap even if time allows) */
  MAX_ROUNDS: 8,

  /** Average duration of an Act 2 round in seconds */
  AVG_ACT2_ROUND_SEC: 120, // 2 minutes per cartridge

  /** How many cartridges to avoid repeating (remember last N) */
  RECENT_CARTRIDGE_MEMORY: 3,

  /** Minimum time remaining to start a new cartridge (ms) */
  MIN_TIME_FOR_NEW_ROUND_MS: 2 * 60 * 1000, // 2 minutes

  /** Allow back-to-back turns for same player? (normally no) */
  ALLOW_BACK_TO_BACK_TURNS: false,

  /** Maximum turn count difference between players */
  MAX_TURN_IMBALANCE: 1, // Everyone gets within 1 turn of each other

  // Future: Cartridge selection preferences
  // CARTRIDGE_SELECTION_MODE: 'balanced' | 'random' | 'voted',
  // ALLOW_PLAYER_VETO: false,
  // CARTRIDGE_DIFFICULTY_SCALING: true,
} as const;

// ============================================================================
// ACT 3 - FINALE
// ============================================================================

/**
 * Act 3 configuration - reveals, highlights, and final scoring
 */
export const ACT3 = {
  /** Maximum number of private facts to reveal (rest are summarized) */
  MAX_REVEALS: 10,

  /** How many highlight categories to show */
  HIGHLIGHT_COUNT: 3,

  /** Highlight categories (shown at end) */
  HIGHLIGHT_CATEGORIES: [
    'Funniest Moment',
    'Most Clever Answer',
    'Biggest Comeback',
    'Most Surprising Fact',
    'Best Bluff',
  ],

  /** Show detailed score breakdown per round? */
  SHOW_SCORE_BREAKDOWN: true,

  /** Show session statistics (total time, rounds played, etc.)? */
  SHOW_SESSION_STATS: true,

  // Future: Awards, achievements, unlockables
  // ENABLE_ACHIEVEMENTS: false,
  // ACHIEVEMENT_DEFINITIONS: [...],
} as const;

// ============================================================================
// SCORING SYSTEM
// ============================================================================

/**
 * Scoring rules and point values
 */
export const SCORING = {
  /** Base scoring range (normal points) */
  MIN_POINTS: 0,
  MAX_POINTS: 5,

  /** Bonus points (rare, awarded for exceptional moments) */
  BONUS_POINTS: 5,

  /** Maximum bonuses allowed per session */
  MAX_BONUSES_PER_SESSION: 2,

  /** Maximum bonuses per player */
  MAX_BONUSES_PER_PLAYER: 1,

  /** Point values for word checkbox grid auto-scoring */
  WORD_GRID: {
    CORRECT: 1, // Selected a correct word
    INCORRECT: -1, // Selected an incorrect word
    SKIPPED: 0, // Didn't select (safe choice)
    MIN_SCORE: 0, // Floor (can't go negative)
  },

  /** Scoring dimension weights (for LLM guidance, not enforced) */
  DIMENSION_WEIGHTS: {
    correctness: 1.0,
    cleverness: 1.2, // Emphasize cleverness slightly
    humor: 1.1,
    bonus: 2.0, // Bonuses are special
  },

  // Future: Advanced scoring features
  // ENABLE_COMBO_BONUSES: false,
  // ENABLE_STREAK_BONUSES: false,
  // ENABLE_HANDICAP_MODE: false, // Scale points by skill level
} as const;

// ============================================================================
// INPUT MODULES
// ============================================================================

/**
 * Input module constraints and defaults
 */
export const INPUT_MODULES = {
  /** Text area configuration */
  TEXTAREA: {
    DEFAULT_PLACEHOLDER: 'Type your answer here...',
    MIN_LENGTH: 1,
    MAX_LENGTH: 300,
    ROWS: 4,
  },

  /** Input field configuration */
  INPUT_FIELD: {
    DEFAULT_PLACEHOLDER: 'Your answer...',
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },

  /** Timed input configuration */
  TIMED_INPUT: {
    DEFAULT_TIME_LIMIT_SEC: 30,
    MIN_TIME_LIMIT_SEC: 10,
    MAX_TIME_LIMIT_SEC: 120,
    WARNING_THRESHOLD_SEC: 5, // Show red warning at 5 seconds
  },

  /** Multiple choice configuration */
  MULTIPLE_CHOICE: {
    MIN_OPTIONS: 2,
    MAX_OPTIONS: 6,
    RECOMMENDED_OPTIONS: 4,
  },

  /** Word checkbox grid configuration */
  WORD_GRID: {
    MIN_WORDS: 8,
    MAX_WORDS: 20,
    RECOMMENDED_WORDS: 12,
    GRID_COLUMNS: 3, // Words per row
  },

  // Future: New input module types
  // DRAWING_CANVAS: { ... },
  // VOICE_RECORDING: { ... },
  // EMOJI_PICKER: { ... },
} as const;

// ============================================================================
// UI / UX
// ============================================================================

/**
 * UI behavior and appearance settings
 */
export const UI = {
  /** Animation durations (ms) */
  ANIMATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500,
  },

  /** Transition delays between screens (ms) */
  SCREEN_TRANSITION_DELAY: 400,

  /** Auto-advance delay for non-interactive screens (ms) */
  AUTO_ADVANCE_DELAY: 3000,

  /** Toast notification duration (ms) */
  TOAST_DURATION: 2000,

  /** Modal backdrop blur */
  MODAL_BLUR: '20px',

  /** Hold-to-reveal duration (ms) */
  HOLD_TO_REVEAL_DURATION: 1000,

  /** Status strip height (px) */
  STATUS_STRIP_HEIGHT: 60,

  /** Action bar height (px) */
  ACTION_BAR_HEIGHT: 80,

  /** Minimum tap target size (px) - accessibility */
  MIN_TAP_TARGET: 44,

  /** Character count warning threshold (percent of max) */
  CHAR_COUNT_WARNING_THRESHOLD: 0.9, // Show warning at 90% full

  // Future: Theming, accessibility
  // ENABLE_DARK_MODE: true,
  // ENABLE_HIGH_CONTRAST: false,
  // ENABLE_REDUCED_MOTION: false,
  // FONT_SIZE_SCALE: 1.0,
} as const;

// ============================================================================
// LLM / AI CONFIGURATION
// ============================================================================

/**
 * OpenAI API and LLM behavior settings
 */
export const LLM = {
  /** Model to use for generation */
  MODEL: 'gpt-4o-mini' as const,

  /** Temperature (0.0 = deterministic, 1.0 = creative) */
  TEMPERATURE: 0.7,

  /** Maximum tokens per response */
  MAX_RESPONSE_TOKENS: 800,

  /** Top P sampling */
  TOP_P: 1.0,

  /** Frequency penalty (reduce repetition) */
  FREQUENCY_PENALTY: 0.3,

  /** Presence penalty (encourage new topics) */
  PRESENCE_PENALTY: 0.1,

  /** Recent events to include in context (for compaction) */
  RECENT_EVENTS_COUNT: 10,

  /** Maximum facts to send in context */
  MAX_FACTS_IN_CONTEXT: 10,

  /** Timeout for API calls (ms) */
  API_TIMEOUT_MS: 30000,

  /** Retry attempts on failure */
  MAX_RETRIES: 3,

  /** Retry delay (ms) */
  RETRY_DELAY_MS: 1000,

  /** DALL-E configuration (for image cartridges) */
  IMAGE_GENERATION: {
    MODEL: 'dall-e-3' as const,
    SIZE: '1024x1024' as const,
    QUALITY: 'standard' as const,
    STYLE: 'natural' as const, // or 'vivid'
  },

  // Future: Advanced AI features
  // ENABLE_EMBEDDINGS: false, // For semantic search of facts
  // ENABLE_FINE_TUNING: false, // Custom model per family
  // ENABLE_VOICE_GENERATION: false, // TTS for reveals
  // ENABLE_VISION: false, // Image input from camera
} as const;

// ============================================================================
// PERSISTENCE & STORAGE
// ============================================================================

/**
 * localStorage and data management settings
 */
export const STORAGE = {
  /** Schema version (increment on breaking changes) */
  SCHEMA_VERSION: '1.0.0',

  /** Auto-save frequency (ms, 0 = save after every action) */
  AUTO_SAVE_INTERVAL_MS: 0, // Immediate save

  /** Maximum sessions to keep (oldest deleted first) */
  MAX_STORED_SESSIONS: 10,

  /** Session staleness threshold (ms) */
  STALE_SESSION_THRESHOLD_MS: 7 * 24 * 60 * 60 * 1000, // 7 days

  /** Enable automatic cleanup of old sessions? */
  AUTO_CLEANUP_ENABLED: true,

  /** Warn user if storage exceeds this size (KB) */
  STORAGE_WARNING_THRESHOLD_KB: 1000, // 1 MB

  // Future: Cloud sync, backups
  // ENABLE_CLOUD_SYNC: false,
  // CLOUD_SYNC_PROVIDER: 'vercel-kv',
  // ENABLE_AUTO_BACKUP: false,
  // BACKUP_FREQUENCY_HOURS: 24,
} as const;

// ============================================================================
// FEATURE FLAGS
// ============================================================================

/**
 * Feature flags for experimental or future functionality
 *
 * Set to false to disable incomplete features
 */
export const FEATURES = {
  /** Enable image generation cartridges (requires DALL-E API) */
  ENABLE_IMAGE_GENERATION: false, // MVP: text-only

  /** Enable ASCII art cartridges */
  ENABLE_ASCII_ART: false, // Future enhancement

  /** Enable word bank / checkbox grid cartridges */
  ENABLE_WORD_GRIDS: true,

  /** Enable multiple choice trivia */
  ENABLE_MULTIPLE_CHOICE: true,

  /** Enable timed challenges */
  ENABLE_TIMED_ROUNDS: true,

  /** Show debug info in UI (dev only) */
  SHOW_DEBUG_INFO: process.env.NODE_ENV === 'development',

  /** Enable session export/import */
  ENABLE_SESSION_EXPORT: true,

  /** Enable "play again" with same players */
  ENABLE_QUICK_REPLAY: true,

  /** Enable Act 3 highlights carousel */
  ENABLE_HIGHLIGHTS: true,

  // Future features to implement
  /** Enable player profile persistence across sessions */
  ENABLE_PLAYER_PROFILES: false,

  /** Enable family "season" tracking (multiple games) */
  ENABLE_SEASONS: false,

  /** Enable custom cartridge creation */
  ENABLE_CUSTOM_CARTRIDGES: false,

  /** Enable photo upload for image-based cartridges */
  ENABLE_PHOTO_UPLOAD: false,

  /** Enable voice recording for answers */
  ENABLE_VOICE_ANSWERS: false,

  /** Enable multi-language support */
  ENABLE_I18N: false,

  /** Enable analytics tracking */
  ENABLE_ANALYTICS: false,

  /** Enable A/B testing framework */
  ENABLE_AB_TESTING: false,
} as const;

// ============================================================================
// SAFETY & CONTENT MODERATION
// ============================================================================

/**
 * Content safety and moderation settings
 */
export const SAFETY = {
  /** Kid-safe mode restrictions */
  KID_SAFE: {
    MAX_AGE: 12,
    FORBIDDEN_TOPICS: [
      'violence',
      'alcohol',
      'drugs',
      'dating',
      'politics',
      'religion',
    ],
    ALLOWED_HUMOR_LEVEL: 'mild',
  },

  /** Teen-adult mode restrictions */
  TEEN_ADULT: {
    MIN_AGE: 13,
    FORBIDDEN_TOPICS: ['extreme violence', 'explicit content'],
    ALLOWED_HUMOR_LEVEL: 'sophisticated',
  },

  /** Enable OpenAI moderation API check */
  ENABLE_MODERATION_API: false, // Future: Add content filtering

  /** Maximum prompt regeneration attempts (if flagged) */
  MAX_REGENERATION_ATTEMPTS: 3,

  // Future: Advanced moderation
  // ENABLE_CUSTOM_WORD_FILTER: false,
  // CUSTOM_BLOCKED_WORDS: [],
  // ENABLE_PARENTAL_CONTROLS: false,
} as const;

// ============================================================================
// ANALYTICS & TELEMETRY (Future)
// ============================================================================

/**
 * Analytics configuration (not yet implemented)
 */
export const ANALYTICS = {
  /** Enable anonymous usage analytics */
  ENABLED: false,

  /** Events to track */
  TRACKED_EVENTS: [
    'session_started',
    'session_completed',
    'session_abandoned',
    'cartridge_played',
    'error_occurred',
  ],

  // Future: Full analytics system
  // ANALYTICS_PROVIDER: 'vercel-analytics',
  // ENABLE_HEATMAPS: false,
  // ENABLE_SESSION_RECORDING: false,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate dynamic target facts count based on player count
 */
export function getTargetFactCount(playerCount: number): number {
  return Math.max(
    ACT1.MIN_FACTS,
    Math.min(
      ACT1.MAX_FACTS,
      Math.ceil(playerCount * ACT1.TARGET_FACTS_PER_PLAYER)
    )
  );
}

/**
 * Calculate dynamic Act 2 rounds based on time remaining
 */
export function getTargetRoundCount(timeRemainingMs: number): number {
  const avgRoundMs = ACT2.AVG_ACT2_ROUND_SEC * 1000;
  const calculatedRounds = Math.floor(timeRemainingMs / avgRoundMs);

  return Math.max(
    ACT2.MIN_ROUNDS,
    Math.min(ACT2.MAX_ROUNDS, calculatedRounds)
  );
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature] === true;
}

/**
 * Get urgency level based on time progress
 */
export function getUrgencyLevel(
  elapsedMs: number,
  targetMs: number
): 'relaxed' | 'steady' | 'urgent' {
  const progress = elapsedMs / targetMs;

  if (progress < 0.33) return 'relaxed';
  if (progress < 0.75) return 'steady';
  return 'urgent';
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * All constants bundled for easy import
 */
export const CONSTANTS = {
  TIMING,
  PLAYERS,
  ACT1,
  ACT2,
  ACT3,
  SCORING,
  INPUT_MODULES,
  UI,
  LLM,
  STORAGE,
  FEATURES,
  SAFETY,
  ANALYTICS,
} as const;

/**
 * Type export for TypeScript consumers
 */
export type Constants = typeof CONSTANTS;
