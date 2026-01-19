/**
 * Mini-Game System Type Definitions
 *
 * Mini-games are interactive challenge sequences that:
 * - Use information from the turns array (no separate facts store)
 * - Have their own dedicated AI prompt/personality
 * - Support multi-turn conversations
 * - Provide real-time scoring with commentary
 */

import type { Turn } from '@/lib/types/game-state';

// ============================================================================
// MINI-GAME SESSIONS
// ============================================================================

export type MiniGameType = 'trivia_challenge'; // Extensible for future games

export type MiniGameStatus =
  | 'intro'       // Showing challenge intro
  | 'playing'     // Player is answering
  | 'scoring'     // AI is evaluating
  | 'complete';   // Done, showing results

/**
 * Trivia Challenge session - tracks the multi-turn conversation
 */
export interface TriviaChallengeSession {
  /** Unique session identifier */
  sessionId: string;

  /** Type of mini-game */
  gameType: 'trivia_challenge';

  /** Player being challenged */
  targetPlayerId: string;
  targetPlayerName: string;

  /** The turn being used as the source (from another player) */
  sourceTurnId: string;
  sourcePlayerId: string;
  sourcePlayerName: string;

  /** Current status */
  status: MiniGameStatus;

  /** The question being asked */
  challengeQuestion: string;

  /** The player's answer */
  playerAnswer?: string;

  /** Score awarded (0-5) */
  score?: number;

  /** AI's scoring commentary */
  scoreCommentary?: string;

  /** When this session started */
  startedAt: string;
}

// Union type for all mini-game sessions (extensible)
export type MiniGameSession = TriviaChallengeSession;

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
  eligibleTurns?: Turn[]; // Turns that can be used for trivia
}

// ============================================================================
// MINI-GAME REGISTRY
// ============================================================================

export interface MiniGameDefinition {
  type: MiniGameType;
  name: string;
  description: string;
  minAct: 1 | 2 | 3;
  checkEligibility: (context: EligibilityContext) => EligibilityResult;
}

// ============================================================================
// RESULT
// ============================================================================

export interface MiniGameResult {
  sessionId: string;
  gameType: MiniGameType;
  playerId: string;
  score: number;
  maxScore: number;
  commentary: string;
}
