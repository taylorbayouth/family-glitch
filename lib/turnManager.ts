/**
 * ============================================================================
 * TURN MANAGER - Fair Turn Distribution System
 * ============================================================================
 *
 * This module ensures every player gets equal opportunities to participate.
 * It prevents any player from getting too many or too few turns compared to others.
 *
 * Key responsibilities:
 * - Select next player fairly (max difference of 1 turn)
 * - Avoid back-to-back turns (usually)
 * - Track turn counts accurately
 * - Handle edge cases (single player, tie-breaking)
 *
 * Design principles:
 * - Deterministic (same inputs → same output)
 * - Transparent (easy to verify fairness)
 * - Flexible (can override for special cartridges)
 */

import { Player, GameState } from '@/types/game';
import { ACT2 } from '@/lib/constants';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Turn selection result - who's next and why
 */
export interface TurnSelection {
  /** Selected player ID */
  playerId: string;

  /** Reason for selection (for debugging) */
  reason: string;

  /** Player's current turn count after this selection */
  newTurnCount: number;

  /** Whether this violates back-to-back rule */
  isBackToBack: boolean;
}

// ============================================================================
// CORE TURN SELECTION
// ============================================================================

/**
 * Select the next player to go
 *
 * Algorithm:
 * 1. Find players with fewest turns
 * 2. Among those, exclude last active player (unless allowed)
 * 3. If multiple candidates, pick next in turn order
 * 4. If no candidates (edge case), fall back to strict rotation
 *
 * @param players - All players in the game
 * @param turnCounts - Current turn count per player
 * @param lastActivePlayerId - Who just went (null if first turn)
 * @param allowBackToBack - Override to allow same player twice in a row
 * @returns Turn selection result
 */
export function selectNextPlayer(
  players: Player[],
  turnCounts: Record<string, number>,
  lastActivePlayerId: string | null = null,
  allowBackToBack: boolean = ACT2.ALLOW_BACK_TO_BACK_TURNS
): TurnSelection {
  // Edge case: single player game (rare, but handle it)
  if (players.length === 1) {
    return {
      playerId: players[0].id,
      reason: 'Only player in game',
      newTurnCount: (turnCounts[players[0].id] || 0) + 1,
      isBackToBack: true,
    };
  }

  // Find minimum turn count
  const minTurns = Math.min(
    ...players.map((p) => turnCounts[p.id] || 0)
  );

  // Get all players with minimum turns
  let candidates = players.filter(
    (p) => (turnCounts[p.id] || 0) === minTurns
  );

  // Exclude last active player unless back-to-back is allowed
  if (!allowBackToBack && lastActivePlayerId) {
    const candidatesWithoutLast = candidates.filter(
      (p) => p.id !== lastActivePlayerId
    );

    // If excluding last player leaves candidates, use them
    if (candidatesWithoutLast.length > 0) {
      candidates = candidatesWithoutLast;
    }
    // Otherwise, we'll allow back-to-back (everyone has same turn count)
  }

  // Among candidates, pick next in turn order
  // Sort by turn order (ascending)
  candidates.sort((a, b) => a.turnOrder - b.turnOrder);

  // If last player was active, pick the next person after them
  if (lastActivePlayerId) {
    const lastPlayer = players.find((p) => p.id === lastActivePlayerId);
    if (lastPlayer) {
      // Find candidates with turn order higher than last player
      const afterLast = candidates.filter(
        (p) => p.turnOrder > lastPlayer.turnOrder
      );

      if (afterLast.length > 0) {
        const selected = afterLast[0];
        return {
          playerId: selected.id,
          reason: `Next in rotation after ${lastPlayer.name} (fewest turns: ${minTurns})`,
          newTurnCount: (turnCounts[selected.id] || 0) + 1,
          isBackToBack: false,
        };
      }
    }
  }

  // Default: pick first candidate (wrap around in rotation)
  const selected = candidates[0];

  return {
    playerId: selected.id,
    reason: `First in rotation with fewest turns (${minTurns})`,
    newTurnCount: (turnCounts[selected.id] || 0) + 1,
    isBackToBack: selected.id === lastActivePlayerId,
  };
}

/**
 * Update turn counts after a player takes a turn
 *
 * @param turnCounts - Current turn counts
 * @param playerId - Player who just took a turn
 * @returns Updated turn counts (immutable)
 */
export function incrementTurnCount(
  turnCounts: Record<string, number>,
  playerId: string
): Record<string, number> {
  return {
    ...turnCounts,
    [playerId]: (turnCounts[playerId] || 0) + 1,
  };
}

// ============================================================================
// TURN FAIRNESS ANALYSIS
// ============================================================================

/**
 * Check if turn distribution is fair (within acceptable imbalance)
 *
 * @param turnCounts - Current turn counts
 * @param playerIds - All player IDs
 * @returns true if distribution is fair
 */
export function isTurnDistributionFair(
  turnCounts: Record<string, number>,
  playerIds: string[]
): boolean {
  if (playerIds.length === 0) return true;

  const counts = playerIds.map((id) => turnCounts[id] || 0);
  const min = Math.min(...counts);
  const max = Math.max(...counts);

  const imbalance = max - min;

  return imbalance <= ACT2.MAX_TURN_IMBALANCE;
}

/**
 * Get turn distribution statistics
 *
 * Useful for debugging and UI display
 */
export function getTurnDistributionStats(
  turnCounts: Record<string, number>,
  playerIds: string[]
): {
  min: number;
  max: number;
  imbalance: number;
  average: number;
  isFair: boolean;
} {
  if (playerIds.length === 0) {
    return { min: 0, max: 0, imbalance: 0, average: 0, isFair: true };
  }

  const counts = playerIds.map((id) => turnCounts[id] || 0);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const sum = counts.reduce((a, b) => a + b, 0);
  const average = sum / counts.length;
  const imbalance = max - min;

  return {
    min,
    max,
    imbalance,
    average,
    isFair: imbalance <= ACT2.MAX_TURN_IMBALANCE,
  };
}

/**
 * Get players who need more turns to catch up
 *
 * @param turnCounts - Current turn counts
 * @param players - All players
 * @returns Array of player IDs who are behind
 */
export function getPlayersBehindInTurns(
  turnCounts: Record<string, number>,
  players: Player[]
): string[] {
  if (players.length === 0) return [];

  const counts = players.map((p) => turnCounts[p.id] || 0);
  const maxTurns = Math.max(...counts);

  return players
    .filter((p) => (turnCounts[p.id] || 0) < maxTurns)
    .map((p) => p.id);
}

// ============================================================================
// TURN ORDER CREATION (SETUP PHASE)
// ============================================================================

/**
 * Assign turn order to players
 *
 * Strategies:
 * - 'clockwise': Use array order as-is (first player goes first)
 * - 'random-fair': Shuffle randomly but ensure fair start
 *
 * @param players - Players to assign turn order (will be modified in place)
 * @param strategy - Turn order strategy
 * @returns Players with turnOrder assigned
 */
export function assignTurnOrder(
  players: Player[],
  strategy: 'clockwise' | 'random-fair'
): Player[] {
  // Make a copy to avoid mutating input
  const playersWithOrder = [...players];

  if (strategy === 'random-fair') {
    // Shuffle using Fisher-Yates algorithm
    for (let i = playersWithOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playersWithOrder[i], playersWithOrder[j]] = [
        playersWithOrder[j],
        playersWithOrder[i],
      ];
    }
  }

  // Assign turn order based on position
  playersWithOrder.forEach((player, index) => {
    player.turnOrder = index;
  });

  return playersWithOrder;
}

/**
 * Select first player for the game
 *
 * @param players - All players
 * @param strategy - Selection strategy
 * @returns First player ID
 */
export function selectFirstPlayer(
  players: Player[],
  strategy: 'first-in-order' | 'random' = 'first-in-order'
): string {
  if (players.length === 0) {
    throw new Error('Cannot select first player: no players provided');
  }

  if (strategy === 'random') {
    const randomIndex = Math.floor(Math.random() * players.length);
    return players[randomIndex].id;
  }

  // Default: first player by turn order
  const sorted = [...players].sort((a, b) => a.turnOrder - b.turnOrder);
  return sorted[0].id;
}

// ============================================================================
// TURN STATE HELPERS
// ============================================================================

/**
 * Get the player object for the active player
 *
 * @param gameState - Current game state
 * @param players - All players
 * @returns Active player or null
 */
export function getActivePlayer(
  gameState: GameState,
  players: Player[]
): Player | null {
  if (!gameState.activePlayerId) return null;

  return players.find((p) => p.id === gameState.activePlayerId) || null;
}

/**
 * Get the player object for the next player
 *
 * @param gameState - Current game state
 * @param players - All players
 * @returns Next player or null
 */
export function getNextPlayer(
  gameState: GameState,
  players: Player[]
): Player | null {
  if (!gameState.nextPlayerId) return null;

  return players.find((p) => p.id === gameState.nextPlayerId) || null;
}

/**
 * Update game state with new active player
 *
 * This function:
 * 1. Selects the next player
 * 2. Updates activePlayerId
 * 3. Pre-calculates nextPlayerId for smooth handoffs
 * 4. Increments turn count
 *
 * @param gameState - Current game state
 * @param players - All players
 * @param allowBackToBack - Override back-to-back rule
 * @returns Updated game state (immutable)
 */
export function advanceToNextPlayer(
  gameState: GameState,
  players: Player[],
  allowBackToBack?: boolean
): GameState {
  // Select next player
  const selection = selectNextPlayer(
    players,
    gameState.turnCounts,
    gameState.activePlayerId,
    allowBackToBack
  );

  // Calculate the player after that (for handoff screen)
  const nextSelection = selectNextPlayer(
    players,
    incrementTurnCount(gameState.turnCounts, selection.playerId),
    selection.playerId,
    allowBackToBack
  );

  // Update state (immutable)
  return {
    ...gameState,
    activePlayerId: selection.playerId,
    nextPlayerId: nextSelection.playerId,
    turnCounts: incrementTurnCount(gameState.turnCounts, selection.playerId),
    lastUpdated: Date.now(),
  };
}

// ============================================================================
// DEBUGGING & LOGGING
// ============================================================================

/**
 * Generate a human-readable turn summary
 *
 * Useful for debugging turn selection logic
 */
export function getTurnSummary(
  players: Player[],
  turnCounts: Record<string, number>,
  activePlayerId: string | null
): string {
  const lines: string[] = ['Turn Summary:'];

  players.forEach((player) => {
    const count = turnCounts[player.id] || 0;
    const isActive = player.id === activePlayerId;
    const marker = isActive ? '→' : ' ';

    lines.push(`${marker} ${player.name}: ${count} turns`);
  });

  const stats = getTurnDistributionStats(
    turnCounts,
    players.map((p) => p.id)
  );

  lines.push(`\nImbalance: ${stats.imbalance} (${stats.isFair ? 'FAIR' : 'UNFAIR'})`);

  return lines.join('\n');
}
