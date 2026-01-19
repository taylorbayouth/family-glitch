import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Player {
  id: string;
  name: string;
  avatar?: string;
}

interface GameState {
  // Game data
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
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      // Initial state
      players: [],
      currentRound: 0,
      gameStarted: false,

      // Actions
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
          currentRound: 1,
        }),

      startNewGame: () =>
        set({
          currentRound: 0,
          gameStarted: false,
          // Keeps players intact
        }),

      resetGame: () =>
        set({
          players: [],
          currentRound: 0,
          gameStarted: false,
        }),

      nextRound: () =>
        set((state) => ({
          currentRound: state.currentRound + 1,
        })),
    }),
    {
      name: 'family-glitch-game', // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Optional: only persist specific fields
      // partialize: (state) => ({ players: state.players }),
    }
  )
);
