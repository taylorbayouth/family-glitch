/**
 * Mini-Game Registry
 *
 * This module provides a centralized registry for mini-games.
 * Each mini-game registers itself here, and the play page uses
 * this registry to dynamically handle any mini-game without
 * needing game-specific code.
 *
 * To add a new mini-game:
 * 1. Create your UI component and logic in /components/mini-games/
 * 2. Create your prompts/parsing in /lib/mini-games/your-game/
 * 3. Register it here using registerMiniGame()
 * 4. Add the AI tool in /lib/ai/template-tools.ts
 *
 * That's it - NO changes needed to play/page.tsx!
 */

import type { ComponentType } from 'react';
import type { Turn } from '@/lib/types/game-state';
import type { MiniGameResult } from './types';

// Player type used by mini-games
export interface MiniGamePlayer {
  id: string;
  name: string;
  role?: string;
  avatar?: number;
  age?: number;
}

// Base props that ALL mini-game components must accept
export interface BaseMiniGameProps {
  targetPlayer: MiniGamePlayer;
  allPlayers: MiniGamePlayer[];
  onComplete: (result: MiniGameResult) => void;
  onSkip?: () => void;
}

// Configuration extracted from the AI's template response
export interface MiniGameConfig {
  [key: string]: unknown;
}

// Definition of a mini-game for the registry
export interface MiniGameDefinition<TConfig extends MiniGameConfig = MiniGameConfig> {
  /** Unique identifier matching the templateType from AI */
  type: string;

  /** Human-readable name */
  name: string;

  /** The React component to render */
  component: ComponentType<BaseMiniGameProps & TConfig>;

  /**
   * Extract mini-game specific config from the template response.
   * Return null if the config is invalid (will fall through to regular question).
   */
  extractConfig: (
    templateConfig: { templateType: string; params?: Record<string, unknown>; [key: string]: unknown },
    context: {
      players: MiniGamePlayer[];
      turns: Turn[];
      currentPlayerId: string;
    }
  ) => TConfig | null;

  /**
   * Optional: Get additional data needed for turn creation.
   * This is stored in the turn's templateParams.
   */
  getTurnData?: (config: TConfig) => Record<string, unknown>;
}

// The registry - maps templateType to mini-game definition
const registry = new Map<string, MiniGameDefinition>();

/**
 * Register a mini-game with the system.
 * Call this at module load time for each mini-game.
 */
export function registerMiniGame<TConfig extends MiniGameConfig>(
  definition: MiniGameDefinition<TConfig>
): void {
  if (registry.has(definition.type)) {
    console.warn(`Mini-game "${definition.type}" is already registered. Overwriting.`);
  }
  registry.set(definition.type, definition as MiniGameDefinition);
}

/**
 * Get a mini-game definition by its template type.
 * Returns undefined if not found.
 */
export function getMiniGame(templateType: string): MiniGameDefinition | undefined {
  return registry.get(templateType);
}

/**
 * Check if a template type is a registered mini-game.
 */
export function isMiniGame(templateType: string): boolean {
  return registry.has(templateType);
}

/**
 * Get all registered mini-games.
 */
export function getAllMiniGames(): MiniGameDefinition[] {
  return Array.from(registry.values());
}

/**
 * Get all mini-game template types.
 */
export function getMiniGameTypes(): string[] {
  return Array.from(registry.keys());
}
