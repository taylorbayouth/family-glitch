/**
 * Announcer AI Types
 *
 * Types for the end-game commentary system that analyzes player performance
 * and provides personalized results.
 */

import type { Player } from '@/lib/store/player-store';
import type { Turn, GameState } from './game-state';

/**
 * Stats calculated for each player
 */
export interface PlayerStats {
  /** Average time to respond in seconds */
  avgResponseTime: number;
  /** Number of mini-games played */
  miniGamesPlayed: number;
  /** Best performing category/template type */
  bestCategory?: string;
  /** Total turns taken */
  totalTurns: number;
  /** Turns skipped or timed out */
  turnsSkipped: number;
}

/**
 * Result for a single player from the announcer
 */
export interface PlayerResult {
  /** Player's unique ID */
  playerId: string;
  /** Player's display name */
  playerName: string;
  /** Final score */
  finalScore: number;
  /** Ranking position (1 = winner) */
  rank: number;
  /** Fun title like "The Trivia Terror" or "The Wildcard" */
  title: string;
  /** 2-3 sentence blurb about their play style */
  blurb: string;
  /** Optional highlight moment (best/funniest answer) */
  highlightMoment?: string;
  /** Performance statistics */
  stats: PlayerStats;
}

/**
 * Complete announcer response
 */
export interface AnnouncerResult {
  /** All players ranked from winner (1) to last place */
  rankings: PlayerResult[];
  /** Overall game summary (optional) */
  gameSummary?: string;
}

/**
 * Input data for the announcer API
 */
export interface AnnouncerInput {
  /** All players in the game */
  players: Player[];
  /** Final scores by player ID */
  scores: Record<string, number>;
  /** All turns from the game */
  turns: Turn[];
  /** Game settings */
  settings: GameState['settings'];
}

/**
 * Announcer API request body
 */
export interface AnnouncerRequest {
  gameData: AnnouncerInput;
}

/**
 * Announcer API response
 */
export interface AnnouncerResponse {
  success: boolean;
  result?: AnnouncerResult;
  error?: string;
}
