import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GameState as GameStateType, Turn, CreateTurnInput, TransitionResponse, TransitionEventState } from '@/lib/types/game-state';
import { calculateTotalRounds, calculateCurrentAct, calculateProgressPercentage } from '@/lib/constants';
import { getPendingTransitionEvent, type TransitionEventDefinition } from '@/lib/act-transitions';

interface Player {
  id: string;
  name: string;
  avatar?: string;
}

interface GameStoreState extends Omit<GameStateType, 'startedAt' | 'endedAt'> {
  // Converted to Date when loading from storage
  startedAt: string;
  endedAt?: string;

  // Legacy field for backwards compatibility (used in getPlayerCount fallback)
  players: Player[];

  // Transition events state (generic system)
  transitionResponses: TransitionResponse[];
  transitionEvents: Record<string, TransitionEventState>;

  // Actions
  startGame: (numberOfPlayers?: number) => void;
  startNewGame: () => void;
  resetGame: () => void;

  // Turn-based actions
  addTurn: (turn: CreateTurnInput) => string;
  updateTurnResponse: (turnId: string, response: Record<string, any>) => void;
  completeTurn: (turnId: string, response: Record<string, any>, duration?: number) => void;
  skipTurn: (turnId: string) => void;
  updatePlayerScore: (playerId: string, points: number) => void;
  getCurrentTurn: () => Turn | null;

  // Generic transition event actions
  addTransitionResponse: (response: Omit<TransitionResponse, 'timestamp'>) => void;
  markTransitionEventComplete: (eventId: string) => void;
  getTransitionResponses: (eventId?: string) => TransitionResponse[];

  // Computed properties (read-only)
  getTotalRounds: () => number;
  getCurrentRound: () => number;
  getCurrentAct: () => 1 | 2 | 3;
  getProgressPercentage: () => number;
  isGameComplete: () => boolean;

  // Generic transition event computed properties
  getPendingTransitionEvent: () => TransitionEventDefinition | null;
  getNextPlayerForEvent: (eventId: string, allPlayerIds: string[]) => string | null;
  getEventState: (eventId: string) => TransitionEventState | null;
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

      // Legacy state
      players: [],

      // Transition events state (generic)
      transitionResponses: [],
      transitionEvents: {},

      // Actions
      startGame: (numberOfPlayers) =>
        set((state) => {
          const resolvedPlayerCount = numberOfPlayers || state.players.length;
          return {
            gameId: crypto.randomUUID(),
            startedAt: new Date().toISOString(),
            status: 'playing',
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
          // Reset transition events for new game
          transitionResponses: [],
          transitionEvents: {},
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
          // Reset transition events
          transitionResponses: [],
          transitionEvents: {},
        }),

      // Turn-based Actions
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

      // Generic transition event actions
      addTransitionResponse: (response) =>
        set((state) => {
          // Initialize event state if not exists
          const eventState = state.transitionEvents[response.eventId] || {
            eventId: response.eventId,
            complete: false,
            collectedFrom: [],
          };

          return {
            transitionResponses: [
              ...state.transitionResponses,
              { ...response, timestamp: new Date().toISOString() },
            ],
            transitionEvents: {
              ...state.transitionEvents,
              [response.eventId]: {
                ...eventState,
                collectedFrom: [...eventState.collectedFrom, response.playerId],
              },
            },
          };
        }),

      markTransitionEventComplete: (eventId) =>
        set((state) => {
          const eventState = state.transitionEvents[eventId] || {
            eventId,
            complete: false,
            collectedFrom: [],
          };

          return {
            transitionEvents: {
              ...state.transitionEvents,
              [eventId]: {
                ...eventState,
                complete: true,
              },
            },
          };
        }),

      getTransitionResponses: (eventId) => {
        const state = get();
        if (eventId) {
          return state.transitionResponses.filter((r) => r.eventId === eventId);
        }
        return state.transitionResponses;
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
        const totalRounds = get().getTotalRounds();
        return calculateCurrentAct(currentRound, totalRounds);
      },

      getProgressPercentage: () => {
        const state = get();
        const currentRound = state.turns.filter(t => t.status === 'completed').length;
        const totalRounds = get().getTotalRounds();
        return calculateProgressPercentage(currentRound, totalRounds);
      },

      isGameComplete: () => {
        const state = get();
        const currentRound = state.turns.filter(t => t.status === 'completed').length;
        const totalRounds = get().getTotalRounds();
        return currentRound >= totalRounds;
      },

      // Generic transition event computed properties
      getPendingTransitionEvent: () => {
        const state = get();
        const currentRound = state.turns.filter(t => t.status === 'completed').length;
        const totalRounds = get().getTotalRounds();
        return getPendingTransitionEvent(currentRound, totalRounds, state.transitionEvents);
      },

      getNextPlayerForEvent: (eventId, allPlayerIds) => {
        const state = get();
        const eventState = state.transitionEvents[eventId];
        const collectedFrom = eventState?.collectedFrom || [];

        // Find the first player who hasn't completed this event yet
        for (const playerId of allPlayerIds) {
          if (!collectedFrom.includes(playerId)) {
            return playerId;
          }
        }
        return null; // All players have completed this event
      },

      getEventState: (eventId) => {
        const state = get();
        return state.transitionEvents[eventId] || null;
      },
    }),
    {
      name: 'family-glitch-game', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
