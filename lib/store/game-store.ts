import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GameState as GameStateType, Turn, CreateTurnInput } from '@/lib/types/game-state';

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
  startGame: () => void;
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
        totalRounds: 10,
        difficulty: 'casual',
        allowTargeting: true,
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

      startGame: () =>
        set({
          gameStarted: true,
          gameId: crypto.randomUUID(),
          startedAt: new Date().toISOString(),
          status: 'playing',
          currentRound: 1,
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
    }),
    {
      name: 'family-glitch-game', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
