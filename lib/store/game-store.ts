import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GameState as GameStateType, Turn, CreateTurnInput } from '@/lib/types/game-state';
import { calculateTotalRounds, calculateCurrentAct, calculateProgressPercentage } from '@/lib/constants';

interface Player {
  id: string;
  name: string;
  avatar?: string;
}

interface GameStoreState extends Omit<GameStateType, 'startedAt' | 'endedAt'> {
  // Converted to Date when loading from storage
  startedAt: string;
  endedAt?: string;

  // Legacy fields (keep for backwards compatibility)
  players: Player[];
  currentRound: number;
  gameStarted: boolean;

  // Actions
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  startGame: (numberOfPlayers?: number) => void;
  startNewGame: () => void;
  resetGame: () => void;
  nextRound: () => void;

  // New turn-based actions
  addTurn: (turn: CreateTurnInput) => string;
  updateTurnResponse: (turnId: string, response: Record<string, any>) => void;
  completeTurn: (turnId: string, response: Record<string, any>, duration?: number) => void;
  skipTurn: (turnId: string) => void;
  updatePlayerScore: (playerId: string, points: number) => void;
  getCurrentTurn: () => Turn | null;

  // Computed properties (read-only)
  getTotalRounds: () => number;
  getCurrentRound: () => number;
  getCurrentAct: () => 1 | 2 | 3;
  getProgressPercentage: () => number;
  isGameComplete: () => boolean;
}

/**
 * Helper function to get player count with fallbacks
 * Priority: settings.numberOfPlayers → players.length → unique players in turns
 */
function getPlayerCount(state: GameStoreState): number {
  let count = state.settings?.numberOfPlayers || state.players.length;
  // If still 0, count unique players from turns (for backward compatibility)
  if (count === 0 && state.turns.length > 0) {
    const uniquePlayerIds = new Set(state.turns.map(t => t.playerId));
    count = uniquePlayerIds.size;
  }
  return count;
}

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      // Initial state - New structure
      gameId: '',
      startedAt: new Date().toISOString(),
      endedAt: undefined,
      turns: [],
      currentTurnIndex: -1,
      status: 'setup',
      scores: {},
      settings: {
        totalRounds: 30,
        difficulty: 'casual',
        allowTargeting: true,
        numberOfPlayers: 0,
      },

      // Legacy state (for backwards compatibility)
      players: [],
      currentRound: 0,
      gameStarted: false,

      // Legacy Actions
      addPlayer: (player) =>
        set((state) => ({
          players: [...state.players, player],
        })),

      removePlayer: (playerId) =>
        set((state) => ({
          players: state.players.filter((p) => p.id !== playerId),
        })),

      startGame: (numberOfPlayers) =>
        set((state) => {
          const resolvedPlayerCount = numberOfPlayers || state.players.length;
          return {
            gameStarted: true,
            gameId: crypto.randomUUID(),
            startedAt: new Date().toISOString(),
            status: 'playing',
            currentRound: 1,
            settings: {
              ...state.settings,
              numberOfPlayers: resolvedPlayerCount,
              totalRounds: calculateTotalRounds(resolvedPlayerCount),
            },
          };
        }),

      startNewGame: () =>
        set({
          gameId: crypto.randomUUID(),
          startedAt: new Date().toISOString(),
          endedAt: undefined,
          turns: [],
          currentTurnIndex: -1,
          status: 'setup',
          scores: {},
          currentRound: 0,
          gameStarted: false,
          // Keeps players intact
        }),

      resetGame: () =>
        set({
          gameId: '',
          startedAt: new Date().toISOString(),
          endedAt: undefined,
          turns: [],
          currentTurnIndex: -1,
          status: 'setup',
          scores: {},
          players: [],
          currentRound: 0,
          gameStarted: false,
        }),

      nextRound: () =>
        set((state) => ({
          currentRound: state.currentRound + 1,
        })),

      // New Turn-based Actions
      addTurn: (turnInput) => {
        const turnId = crypto.randomUUID();
        set((state) => {
          const newTurn: Turn = {
            ...turnInput,
            turnId,
            timestamp: new Date().toISOString(),
            status: 'pending',
            response: null,
          };

          return {
            turns: [...state.turns, newTurn],
            currentTurnIndex: state.turns.length,
          };
        });
        return turnId;
      },

      updateTurnResponse: (turnId, response) =>
        set((state) => ({
          turns: state.turns.map((turn) =>
            turn.turnId === turnId ? { ...turn, response } : turn
          ),
        })),

      completeTurn: (turnId, response, duration) =>
        set((state) => ({
          turns: state.turns.map((turn) =>
            turn.turnId === turnId
              ? {
                  ...turn,
                  response,
                  status: 'completed' as const,
                  duration,
                }
              : turn
          ),
        })),

      skipTurn: (turnId) =>
        set((state) => ({
          turns: state.turns.map((turn) =>
            turn.turnId === turnId
              ? { ...turn, status: 'skipped' as const }
              : turn
          ),
        })),

      updatePlayerScore: (playerId, points) =>
        set((state) => ({
          scores: {
            ...state.scores,
            [playerId]: (state.scores[playerId] || 0) + points,
          },
        })),

      getCurrentTurn: () => {
        const state = get();
        if (
          state.currentTurnIndex >= 0 &&
          state.currentTurnIndex < state.turns.length
        ) {
          return state.turns[state.currentTurnIndex];
        }
        return null;
      },

      // Computed properties for game progression
      getTotalRounds: () => {
        const state = get();
        return calculateTotalRounds(getPlayerCount(state));
      },

      getCurrentRound: () => {
        const state = get();
        // Current round = number of completed turns
        return state.turns.filter(t => t.status === 'completed').length;
      },

      getCurrentAct: () => {
        const state = get();
        const currentRound = state.turns.filter(t => t.status === 'completed').length;
        const totalRounds = get().getTotalRounds(); // Reuse getTotalRounds logic
        return calculateCurrentAct(currentRound, totalRounds);
      },

      getProgressPercentage: () => {
        const state = get();
        const currentRound = state.turns.filter(t => t.status === 'completed').length;
        const totalRounds = get().getTotalRounds(); // Reuse getTotalRounds logic
        return calculateProgressPercentage(currentRound, totalRounds);
      },

      isGameComplete: () => {
        const state = get();
        const currentRound = state.turns.filter(t => t.status === 'completed').length;
        const totalRounds = get().getTotalRounds(); // Reuse getTotalRounds logic
        return currentRound >= totalRounds;
      },
    }),
    {
      name: 'family-glitch-game', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
