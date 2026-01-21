/**
 * Global application constants
 */

// Application info
export const APP_NAME = 'Family Glitch';
export const APP_DESCRIPTION = 'A family game application with AI integration';
export const APP_VERSION = '1.1.2';
export const APP_TAGLINE = 'DIGITAL NOIR';

// URLs
export const APP_URL_PRODUCTION = 'https://family-glitch.vercel.app';
export const APP_URL_LOCAL = 'http://localhost:3000';
export const GITHUB_REPO = 'https://github.com/taylorbayouth/family-glitch';

// OAuth
export const OAUTH_REDIRECT_PATH = '/api/auth/callback/google';
export const OAUTH_SIGNIN_PATH = '/auth/signin';

// AI Configuration
export const DEFAULT_AI_MODEL = 'gpt-5.2';
export const DEFAULT_TEMPERATURE = 1;
export const DEFAULT_MAX_TOKENS = 4096;
export const MAX_TOOL_ITERATIONS = 10;

// Available AI Models
export const AI_MODELS = {
  GPT_5_2: 'gpt-5.2',
  GPT_5_2_INSTANT: 'gpt-5.2-instant',
  GPT_5_2_THINKING: 'gpt-5.2-thinking',
  GPT_5_2_PRO: 'gpt-5.2-pro',
  GPT_4_TURBO: 'gpt-4-turbo',
  GPT_4: 'gpt-4',
} as const;

// Temperature presets
export const TEMPERATURE_PRESETS = {
  PRECISE: 0.0,   // Deterministic, factual
  BALANCED: 0.7,  // Default, good balance
  CREATIVE: 1.0,  // Creative writing, brainstorming
} as const;

// API Endpoints
export const API_ROUTES = {
  CHAT: '/api/chat',
  AUTH: '/api/auth/[...nextauth]',
  HEALTH: '/api/health',
} as const;

// Pages
export const PAGES = {
  HOME: '/',
  CHAT: '/chat',
  SIGNIN: '/auth/signin',
} as const;

// Game Duration & Progression
export const AVERAGE_TURNS_PER_PLAYER = 4; // Tunable: Adjust this to change game length

/**
 * Calculate total number of rounds based on player count
 * Formula: numberOfPlayers * AVERAGE_TURNS_PER_PLAYER
 */
export function calculateTotalRounds(numberOfPlayers: number): number {
  return numberOfPlayers * AVERAGE_TURNS_PER_PLAYER;
}

/**
 * Calculate which act the game is currently in (1, 2, or 3)
 * Acts divide the game into thirds (33%, 66%, 100%)
 */
export function calculateCurrentAct(currentRound: number, totalRounds: number): 1 | 2 | 3 {
  if (totalRounds === 0) return 1;
  const progress = currentRound / totalRounds;
  if (progress < 0.25) return 1;
  if (progress < 0.75) return 2;
  return 3;
}

/**
 * Calculate progress percentage (0-100)
 */
export function calculateProgressPercentage(currentRound: number, totalRounds: number): number {
  if (totalRounds === 0) return 0;
  return Math.min(Math.round((currentRound / totalRounds) * 100), 100);
}

// Environment variables (type-safe access)
export function getEnv(key: string): string | undefined {
  return process.env[key];
}

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}
