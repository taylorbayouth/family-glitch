import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, GamePhase, Player, Challenge, ScoreUpdate, MiniGame } from '@/types/game';

const DEFAULT_PLAYERS: Record<string, Player> = {
  'Taylor': { name: 'Taylor', score: 0, tags: ['Dad'] },
  'Beth': { name: 'Beth', score: 0, tags: ['Mom'] },
  'Eliana': { name: 'Eliana', score: 0, tags: ['Daughter'] },
};

const createInitialState = (): GameState => ({
  meta: {
    turn: 0,
    maxTurns: 10,
    phase: 'SETUP',
    currentPlayer: '',
    currentMiniGame: null,
    vibe: '',
  },
  players: { ...DEFAULT_PLAYERS },
  shadowData: {
    adjectives: [],
    verbs: [],
    nouns: [],
    observations: [],
  },
  history: [],
  currentChallenge: null,
  pendingAnswers: {},
});

interface GameStore {
  gameState: GameState;
  isLoading: boolean;
  lastAIResponse: {
    display?: { title: string; message: string; subtext?: string };
    scoreUpdates?: ScoreUpdate[];
    poem?: string;
  } | null;

  // Actions
  setPhase: (phase: GamePhase) => void;
  setCurrentPlayer: (player: string) => void;
  setCurrentMiniGame: (game: MiniGame | null) => void;
  setVibe: (vibe: string) => void;
  updatePlayerNames: (names: string[]) => void;
  updateScore: (player: string, points: number) => void;
  addShadowData: (type: keyof GameState['shadowData'], value: string) => void;
  addHistory: (entry: string) => void;
  setChallenge: (challenge: Challenge | null) => void;
  addPendingAnswer: (player: string, answer: string) => void;
  clearPendingAnswers: () => void;
  nextTurn: () => void;
  setLoading: (loading: boolean) => void;
  setAIResponse: (response: GameStore['lastAIResponse']) => void;
  updateFromAI: (newState: Partial<GameState>) => void;
  setHiveMindQuestion: (question: string) => void;
  setVentriloquistData: (answer: string, target: string) => void;
  setWagerData: (bid: number, topic: string) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      gameState: createInitialState(),
      isLoading: false,
      lastAIResponse: null,

      setPhase: (phase) =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            meta: { ...state.gameState.meta, phase },
          },
        })),

      setCurrentPlayer: (player) =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            meta: { ...state.gameState.meta, currentPlayer: player },
          },
        })),

      setCurrentMiniGame: (game) =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            meta: { ...state.gameState.meta, currentMiniGame: game },
          },
        })),

      setVibe: (vibe) =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            meta: { ...state.gameState.meta, vibe },
          },
        })),

      updatePlayerNames: (names) =>
        set((state) => {
          const newPlayers: Record<string, Player> = {};
          names.forEach((name, index) => {
            const tags = index === 0 ? ['Dad'] : index === 1 ? ['Mom'] : ['Daughter'];
            newPlayers[name] = { name, score: 0, tags };
          });
          return {
            gameState: {
              ...state.gameState,
              players: newPlayers,
            },
          };
        }),

      updateScore: (player, points) =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            players: {
              ...state.gameState.players,
              [player]: {
                ...state.gameState.players[player],
                score: (state.gameState.players[player]?.score || 0) + points,
              },
            },
          },
        })),

      addShadowData: (type, value) =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            shadowData: {
              ...state.gameState.shadowData,
              [type]: [...state.gameState.shadowData[type], value],
            },
          },
        })),

      addHistory: (entry) =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            history: [...state.gameState.history, entry],
          },
        })),

      setChallenge: (challenge) =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            currentChallenge: challenge,
          },
        })),

      addPendingAnswer: (player, answer) =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            pendingAnswers: {
              ...state.gameState.pendingAnswers,
              [player]: answer,
            },
          },
        })),

      clearPendingAnswers: () =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            pendingAnswers: {},
          },
        })),

      nextTurn: () =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            meta: {
              ...state.gameState.meta,
              turn: state.gameState.meta.turn + 1,
            },
          },
        })),

      setLoading: (loading) => set({ isLoading: loading }),

      setAIResponse: (response) => set({ lastAIResponse: response }),

      updateFromAI: (newState) =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            ...newState,
            meta: {
              ...state.gameState.meta,
              ...(newState.meta || {}),
            },
            players: {
              ...state.gameState.players,
              ...(newState.players || {}),
            },
            shadowData: {
              ...state.gameState.shadowData,
              ...(newState.shadowData || {}),
            },
          },
        })),

      setHiveMindQuestion: (question) =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            hiveMindQuestion: question,
          },
        })),

      setVentriloquistData: (answer, target) =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            ventriloquistAnswer: answer,
            ventriloquistTarget: target,
          },
        })),

      setWagerData: (bid, topic) =>
        set((state) => ({
          gameState: {
            ...state.gameState,
            wagerBid: bid,
            wagerTopic: topic,
          },
        })),

      resetGame: () =>
        set({
          gameState: createInitialState(),
          isLoading: false,
          lastAIResponse: null,
        }),
    }),
    {
      name: 'family-glitch-storage',
      partialize: (state) => ({ gameState: state.gameState }),
    }
  )
);
