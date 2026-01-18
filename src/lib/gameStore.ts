import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GameState,
  Player,
  StoredData,
  RatingResult,
  GamePhase,
  GameAct,
  ScoreEvent,
  InterfaceConfig,
  GameCartridge,
  CurrentTurn,
} from '@/types/game';

// -----------------
// HELPER: Calculate Current Act
// -----------------

const calculateAct = (turn: number): GameAct => {
  if (turn <= 4) return 'ACT_1';
  if (turn <= 8) return 'ACT_2';
  return 'ACT_3';
};

// -----------------
// INITIAL STATE
// -----------------

const createInitialState = (): GameState => ({
  meta: {
    turn_count: 0,
    max_turns: 12,
    current_player_index: 0,
    phase: 'SETUP',
    arc: {
      current_act: 'ACT_1',
      act_1_range: [1, 4],
      act_2_range: [5, 8],
      act_3_range: [9, 12],
    },
    game_started_at: Date.now(),
    vibe: '',
  },
  players: [],
  storage: [],
  ratings: [],
  current_turn: {
    player_id: '',
    actions: [],
    current_action_index: 0,
    temp_data: {},
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
    finale?: {
      winner_id: string;
      recap: string;
      highlights: string[];
    };
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

  // Storage Actions
  addStoredData: (data: StoredData) => void;
  getStoredData: (tags?: string[], scope?: StoredData['scope']) => StoredData[];
  clearTurnScopedStorage: () => void;

  // Rating Actions
  addRating: (rating: RatingResult) => void;
  getRatingsForData: (data_id: string) => RatingResult[];

  // Turn Management
  nextTurn: () => void;
  updateCurrentTurn: (data: Partial<CurrentTurn>) => void;
  clearCurrentTurn: () => void;

  // Scoring
  addScoreEvent: (event: ScoreEvent) => void;

  // Arc Management
  getCurrentAct: () => GameAct;
  isInAct: (act: GameAct) => boolean;

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
            age: undefined,
            relationship: undefined,
          }));

          console.log('[STORAGE] 💾 Game initialized - saving to localStorage:', {
            players: names,
            vibe,
            phase: 'PLAYING',
            turn: 1,
          });

          return {
            gameState: {
              ...state.gameState,
              players,
              meta: {
                ...state.gameState.meta,
                vibe,
                phase: 'PLAYING',
                game_started_at: Date.now(),
                turn_count: 1,
              },
              current_turn: {
                player_id: players[0].id,
                actions: [],
                current_action_index: 0,
                temp_data: {},
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
          const nextPlayer = state.gameState.players[nextIndex];
          return {
            gameState: {
              ...state.gameState,
              meta: {
                ...state.gameState.meta,
                current_player_index: nextIndex,
              },
              current_turn: {
                ...state.gameState.current_turn,
                player_id: nextPlayer.id,
              },
            },
          };
        }),

      getCurrentPlayer: () => {
        const state = get().gameState;
        return state.players[state.meta.current_player_index] || null;
      },

      addStoredData: (data) =>
        set((state) => {
          console.log('[STORAGE] 💾 Storing data:', {
            scope: data.scope,
            tags: data.tags,
            value: data.value,
            turn: data.turn_collected,
          });
          return {
            gameState: {
              ...state.gameState,
              storage: [...state.gameState.storage, data],
            },
          };
        }),

      getStoredData: (tags, scope) => {
        const storage = get().gameState.storage;
        let filtered = storage;

        if (tags && tags.length > 0) {
          filtered = filtered.filter((item) =>
            tags.some((tag) => item.tags.includes(tag))
          );
        }

        if (scope) {
          filtered = filtered.filter((item) => item.scope === scope);
        }

        return filtered;
      },

      clearTurnScopedStorage: () =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            storage: state.gameState.storage.filter((item) => item.scope !== 'turn'),
          },
        })),

      addRating: (rating) =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            ratings: [...state.gameState.ratings, rating],
          },
        })),

      getRatingsForData: (data_id) => {
        return get().gameState.ratings.filter((r) => r.data_id === data_id);
      },

      nextTurn: () =>
        set((state) => {
          const newTurnCount = state.gameState.meta.turn_count + 1;
          const newAct = calculateAct(newTurnCount);

          return {
            gameState: {
              ...state.gameState,
              meta: {
                ...state.gameState.meta,
                turn_count: newTurnCount,
                arc: {
                  ...state.gameState.meta.arc,
                  current_act: newAct,
                },
              },
            },
          };
        }),

      updateCurrentTurn: (data) =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            current_turn: {
              ...state.gameState.current_turn,
              ...data,
            },
          },
        })),

      clearCurrentTurn: () =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            current_turn: {
              player_id: state.gameState.current_turn.player_id,
              actions: [],
              current_action_index: 0,
              temp_data: {},
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

      getCurrentAct: () => {
        return get().gameState.meta.arc.current_act;
      },

      isInAct: (act) => {
        return get().gameState.meta.arc.current_act === act;
      },

      applyAIResponse: (response) =>
        set((state) => {
          const newState = { ...state };

          console.log('[STORAGE] 💾 Applying AI response - saving to localStorage:', {
            has_display: !!response.display,
            has_interface: !!response.interface,
            interface_type: response.interface?.type,
            has_updates: !!response.updates,
            has_score_event: !!response.score_event,
            new_storage_items: response.updates?.storage?.length || 0,
            new_ratings: response.updates?.ratings?.length || 0,
          });

          // Store the response for display
          if (response.display || response.score_event || response.finale) {
            newState.lastAIResponse = {
              display: response.display,
              score_event: response.score_event,
              finale: response.finale,
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
              const newTurnCount = updates.turn_count;
              newState.gameState.meta.turn_count = newTurnCount;
              newState.gameState.meta.arc.current_act = calculateAct(newTurnCount);
              console.log('[STORAGE] 📊 Turn advanced:', {
                turn: newTurnCount,
                act: calculateAct(newTurnCount),
              });
            }

            if (updates.current_player_index !== undefined) {
              newState.gameState.meta.current_player_index =
                updates.current_player_index;
            }

            if (updates.current_turn) {
              newState.gameState.current_turn = {
                ...newState.gameState.current_turn,
                ...updates.current_turn,
              };
            }

            if (updates.storage) {
              newState.gameState.storage = [
                ...newState.gameState.storage,
                ...updates.storage,
              ];
            }

            if (updates.ratings) {
              newState.gameState.ratings = [
                ...newState.gameState.ratings,
                ...updates.ratings,
              ];
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
            console.log('[STORAGE] 🎯 Score updated:', {
              player_id: event.player_id,
              points: event.points,
              bonus: event.bonus,
              total: event.points + event.bonus,
            });
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
      name: 'family-glitch-storage',
      partialize: (state) => ({ gameState: state.gameState }),
      onRehydrateStorage: () => {
        console.log('[STORAGE] 🔄 Loading from localStorage...');
        return (state) => {
          if (state) {
            console.log('[STORAGE] ✅ Loaded from localStorage:', {
              turn: state.gameState.meta.turn_count,
              act: state.gameState.meta.arc.current_act,
              phase: state.gameState.meta.phase,
              players: state.gameState.players.length,
              permanent_facts: state.gameState.storage.filter(s => s.scope === 'permanent').length,
              total_storage: state.gameState.storage.length,
              ratings: state.gameState.ratings.length,
            });
          } else {
            console.log('[STORAGE] ℹ️ No existing localStorage found - starting fresh');
          }
        };
      },
    }
  )
);
