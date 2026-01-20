/**
 * Trivia Challenge Registration
 *
 * Registers the Trivia Challenge mini-game with the central registry.
 */

import { TriviaChallengeUI } from '@/components/mini-games/TriviaChallengeUI';
import { registerMiniGame, type MiniGameConfig } from '../registry';
import { selectTurnForTrivia, getEligibleTurnsForPlayer } from '../eligibility';
import type { Turn } from '@/lib/types/game-state';

// Config specific to Trivia Challenge
export interface TriviaConfig extends MiniGameConfig {
  sourceTurn: Turn;
}

registerMiniGame<TriviaConfig>({
  type: 'trivia_challenge',
  name: 'Trivia Challenge',

  // Cast needed because TriviaChallengeUI has slightly different prop types
  // (uses `Turn` type for sourceTurn instead of generic config)
  component: TriviaChallengeUI as any,

  extractConfig: (templateConfig, context) => {
    const { players, turns, currentPlayerId } = context;

    // Get eligible turns for trivia (completed turns from other players)
    const eligibleTurns = getEligibleTurnsForPlayer(
      (turns || []).filter(t => t.status === 'completed'),
      currentPlayerId
    );

    if (eligibleTurns.length < 1) {
      return null; // Not enough data for trivia
    }

    // Find the source turn
    const sourcePlayerId = templateConfig.params?.sourcePlayerId as string | undefined;
    const selectedTurn = sourcePlayerId
      ? eligibleTurns.find(t => t.playerId === sourcePlayerId)
      : selectTurnForTrivia(eligibleTurns);

    if (!selectedTurn) {
      return null; // No valid source turn
    }

    return {
      sourceTurn: selectedTurn,
    };
  },

  getTurnData: (config) => ({
    sourceTurnId: config.sourceTurn.turnId,
    sourcePlayerId: config.sourceTurn.playerId,
  }),
});
