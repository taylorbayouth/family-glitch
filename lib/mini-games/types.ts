/**
 * Mini-Game System Type Definitions
 *
 * Mini-games are interactive challenge sequences that:
 * - Use information from the turns array (no separate facts store)
 * - Have their own dedicated AI prompt/personality
 * - Support multi-turn conversations
 * - Provide real-time scoring with commentary
 *
 * ARCHITECTURE:
 * - Each mini-game is a self-contained module
 * - The apparatus (play page) handles common logic: phase transitions, scoring, handoffs
 * - Mini-games provide: prompt builders, UI components, and config
 */

import type { Turn } from '@/lib/types/game-state';

// ============================================================================
// MINI-GAME TYPES (extensible)
// ============================================================================

export type MiniGameType =
  | 'trivia_challenge'
  | 'personality_match'
  | 'madlibs_challenge'
  | 'cryptic_connection'
  | 'hard_trivia'
  | 'the_filter'
  | 'lighting_round';

export type MiniGameStatus =
  | 'intro'       // Showing challenge intro
  | 'playing'     // Player is answering
  | 'scoring'     // AI is evaluating
  | 'complete';   // Done, showing results

// ============================================================================
// BASE MINI-GAME INTERFACES
// ============================================================================

/**
 * Base context passed to all mini-games
 */
export interface MiniGameContext {
  /** Player being challenged */
  targetPlayerId: string;
  targetPlayerName: string;

  /** All players in the game */
  allPlayers: Array<{ id: string; name: string; role?: string }>;

  /** Current scores */
  scores: Record<string, number>;

  /** All completed turns (for AI to reference) */
  completedTurns: Turn[];
}

/**
 * Base result returned by all mini-games
 */
export interface MiniGameResult {
  /** Score awarded (0-5 scale, or negative when penalties apply) */
  score: number;

  /** Max possible score */
  maxScore: number;

  /** AI's commentary on the result */
  commentary: string;

  /** Optional: the correct answer for reveal */
  correctAnswer?: string;

  /** Optional: bonus info or fun fact */
  bonusInfo?: string;
}

/**
 * Props that all mini-game UI components receive from the apparatus
 */
export interface BaseMiniGameUIProps {
  /** Context about the current challenge */
  context: MiniGameContext;

  /** Called when the mini-game completes */
  onComplete: (result: MiniGameResult) => void;

  /** Called if user wants to skip */
  onSkip?: () => void;
}

// ============================================================================
// TRIVIA CHALLENGE SPECIFIC
// ============================================================================

export interface TriviaChallengeContext extends MiniGameContext {
  /** The turn being used as the source (from another player) */
  sourceTurn: Turn;
  sourcePlayerId: string;
  sourcePlayerName: string;
}

export interface TriviaChallengeSession {
  sessionId: string;
  gameType: 'trivia_challenge';
  targetPlayerId: string;
  targetPlayerName: string;
  sourceTurnId: string;
  sourcePlayerId: string;
  sourcePlayerName: string;
  status: MiniGameStatus;
  challengeQuestion: string;
  playerAnswer?: string;
  score?: number;
  scoreCommentary?: string;
  startedAt: string;
}

// ============================================================================
// PERSONALITY MATCH SPECIFIC
// ============================================================================

/**
 * Personality Match: Player selects words that describe a target player
 * AI scores based on how well selections match previous group responses
 */
export interface PersonalityMatchContext extends MiniGameContext {
  /** Player whose personality is being matched */
  subjectPlayerId: string;
  subjectPlayerName: string;

  /** The words to choose from */
  wordOptions: string[];
}

export interface PersonalityMatchSession {
  sessionId: string;
  gameType: 'personality_match';
  targetPlayerId: string;        // Who is answering
  targetPlayerName: string;
  subjectPlayerId: string;       // Who the words describe
  subjectPlayerName: string;
  status: MiniGameStatus;
  wordOptions: string[];
  selectedWords?: string[];
  score?: number;
  scoreCommentary?: string;
  startedAt: string;
}

// ============================================================================
// MADLIBS CHALLENGE SPECIFIC
// ============================================================================

/**
 * A blank in the Mad Libs sentence
 */
export interface MadLibsBlank {
  /** Position in the sentence (0-indexed) */
  index: number;
  /** The letter the word must start with */
  letter: string;
  /** Player's filled word (set during play) */
  filledWord?: string;
}

/**
 * Mad Libs Challenge: AI provides a sentence with blanks, player fills with words
 * starting with assigned letters. AI scores for creativity/humor.
 */
export interface MadLibsChallengeContext extends MiniGameContext {
  /** The sentence template with ___ for blanks */
  sentenceTemplate: string;
  /** The blanks to fill */
  blanks: MadLibsBlank[];
}

export interface MadLibsChallengeSession {
  sessionId: string;
  gameType: 'madlibs_challenge';
  targetPlayerId: string;
  targetPlayerName: string;
  status: MiniGameStatus;
  sentenceTemplate: string;
  blanks: MadLibsBlank[];
  filledSentence?: string;
  score?: number;
  scoreCommentary?: string;
  startedAt: string;
}

// Union type for all mini-game sessions (extensible)
export type MiniGameSession = TriviaChallengeSession | PersonalityMatchSession | MadLibsChallengeSession;

// ============================================================================
// ELIGIBILITY
// ============================================================================

export interface EligibilityContext {
  currentAct: 1 | 2 | 3;
  currentPlayerId: string;
  turns: Turn[];
  playerIds: string[];
}

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
  eligibleTurns?: Turn[]; // Turns that can be used
  eligiblePlayers?: string[]; // Players that can be subjects
}

// ============================================================================
// MINI-GAME ELIGIBILITY
// ============================================================================

export interface MiniGameEligibilityDef {
  type: MiniGameType;
  name: string;
  description: string;
  minAct: 1 | 2 | 3;
  checkEligibility: (context: EligibilityContext) => EligibilityResult;
}
