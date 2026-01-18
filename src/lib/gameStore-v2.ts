import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GameState,
  Player,
  VaultFact,
  GamePhase,
  CurrentTurnData,
  ScoreEvent,
  InterfaceConfig,
} from '@/types/game-v2';

// -----------------
// INITIAL STATE
// -----------------

const createInitialState = (): GameState => ({
  meta: {
    turn_count: 0,
    max_turns: 12,
    current_player_index: 0,
    phase: 'SETUP',
    game_started_at: Date.now(),
    vibe: '',
  },
  players: [],
  the_vault: [],
  current_turn_data: {
    mini_game: null,
    step: 1,
  },
  score_history: [],
});

// -----------------
// STORE INTERFACE
// -----------------

interface GameStore {
  // State
  gameState: GameState;
  isLoading: boolean;
  currentInterface: InterfaceConfig | null;
  lastAIResponse: {
    display?: { title: string; message: string; subtext?: string };
    score_event?: ScoreEvent;
  } | null;

  // Basic Actions
  setPhase: (phase: GamePhase) => void;
  setLoading: (loading: boolean) => void;
  setInterface: (config: InterfaceConfig | null) => void;

  // Player Actions
  initializePlayers: (names: string[], vibe: string) => void;
  updatePlayerScore: (player_id: string, points: number, bonus: number) => void;
  nextPlayer: () => void;
  getCurrentPlayer: () => Player | null;

  // Vault Actions
  addToVault: (fact: VaultFact) => void;
  getVaultFacts: (type?: VaultFact['type']) => VaultFact[];

  // Turn Management
  nextTurn: () => void;
  updateTurnData: (data: Partial<CurrentTurnData>) => void;
  clearTurnData: () => void;

  // Scoring
  addScoreEvent: (event: ScoreEvent) => void;

  // AI Response Handling
  applyAIResponse: (response: any) => void;

  // Reset
  resetGame: () => void;
}

// -----------------
// STORE IMPLEMENTATION
// -----------------

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      gameState: createInitialState(),
      isLoading: false,
      currentInterface: null,
      lastAIResponse: null,

      setPhase: (phase) =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            meta: { ...state.gameState.meta, phase },
          },
        })),

      setLoading: (loading) => set({ isLoading: loading }),

      setInterface: (config) => set({ currentInterface: config }),

      initializePlayers: (names, vibe) =>
        set((state) => {
          const avatars = ['👨‍💻', '🍷', '🦄', '🎮', '🎸', '🎨', '🚀', '🌟'];
          const players: Player[] = names.map((name, i) => ({
            id: `p${i + 1}`,
            name,
            score: 0,
            avatar: avatars[i] || '👤',
          }));

          return {
            gameState: {
              ...state.gameState,
              players,
              meta: {
                ...state.gameState.meta,
                vibe,
                phase: 'PASS_SCREEN',
                game_started_at: Date.now(),
              },
            },
          };
        }),

      updatePlayerScore: (player_id, points, bonus) =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            players: state.gameState.players.map((p) =>
              p.id === player_id ? { ...p, score: p.score + points + bonus } : p
            ),
          },
        })),

      nextPlayer: () =>
        set((state) => {
          const nextIndex =
            (state.gameState.meta.current_player_index + 1) %
            state.gameState.players.length;
          return {
            gameState: {
              ...state.gameState,
              meta: {
                ...state.gameState.meta,
                current_player_index: nextIndex,
              },
            },
          };
        }),

      getCurrentPlayer: () => {
        const state = get().gameState;
        return state.players[state.meta.current_player_index] || null;
      },

      addToVault: (fact) =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            the_vault: [...state.gameState.the_vault, fact],
          },
        })),

      getVaultFacts: (type) => {
        const facts = get().gameState.the_vault;
        return type ? facts.filter((f) => f.type === type) : facts;
      },

      nextTurn: () =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            meta: {
              ...state.gameState.meta,
              turn_count: state.gameState.meta.turn_count + 1,
            },
          },
        })),

      updateTurnData: (data) =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            current_turn_data: {
              ...state.gameState.current_turn_data,
              ...data,
            },
          },
        })),

      clearTurnData: () =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            current_turn_data: {
              mini_game: null,
              step: 1,
            },
          },
        })),

      addScoreEvent: (event) =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            score_history: [...state.gameState.score_history, event],
          },
        })),

      applyAIResponse: (response) =>
        set((state) => {
          const newState = { ...state };

          // Store the response for display
          if (response.display || response.score_event) {
            newState.lastAIResponse = {
              display: response.display,
              score_event: response.score_event,
            };
          }

          // Update interface
          if (response.interface) {
            newState.currentInterface = response.interface;
          }

          // Apply state updates
          if (response.updates) {
            const updates = response.updates;

            if (updates.phase) {
              newState.gameState.meta.phase = updates.phase;
            }

            if (updates.turn_count !== undefined) {
              newState.gameState.meta.turn_count = updates.turn_count;
            }

            if (updates.current_player_index !== undefined) {
              newState.gameState.meta.current_player_index =
                updates.current_player_index;
            }

            if (updates.current_turn_data) {
              newState.gameState.current_turn_data = {
                ...newState.gameState.current_turn_data,
                ...updates.current_turn_data,
              };
            }

            if (updates.the_vault) {
              newState.gameState.the_vault = updates.the_vault;
            }
          }

          // Apply score event
          if (response.score_event) {
            const event = response.score_event;
            newState.gameState.score_history.push(event);

            // Update player score
            newState.gameState.players = newState.gameState.players.map((p) =>
              p.id === event.player_id
                ? { ...p, score: p.score + event.points + event.bonus }
                : p
            );
          }

          return newState;
        }),

      resetGame: () =>
        set({
          gameState: createInitialState(),
          isLoading: false,
          currentInterface: null,
          lastAIResponse: null,
        }),
    }),
    {
      name: 'family-glitch-v2-storage',
      partialize: (state) => ({ gameState: state.gameState }),
    }
  )
);
