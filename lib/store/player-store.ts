import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type PlayerRole =
  | 'Dad'
  | 'Mom'
  | 'Son'
  | 'Daughter'
  | 'Brother'
  | 'Sister'
  | 'Grandpa'
  | 'Grandma'
  | 'Uncle'
  | 'Aunt'
  | 'Cousin'
  | 'Friend'
  | 'Other';

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  age: number;
  avatar: number; // 1-20
}

interface PlayerState {
  // Player roster (persistent across games)
  players: Player[];

  // Actions
  addPlayer: (player: Omit<Player, 'id'>) => void;
  updatePlayer: (id: string, updates: Partial<Omit<Player, 'id'>>) => void;
  removePlayer: (id: string) => void;
  clearAllPlayers: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      // Initial state: 3 empty player slots
      players: [],

      // Actions
      addPlayer: (player) =>
        set((state) => ({
          players: [...state.players, { ...player, id: crypto.randomUUID() }],
        })),

      updatePlayer: (id, updates) =>
        set((state) => ({
          players: state.players.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      removePlayer: (id) =>
        set((state) => ({
          players: state.players.filter((p) => p.id !== id),
        })),

      clearAllPlayers: () =>
        set({
          players: [],
        }),
    }),
    {
      name: 'family-glitch-players', // Separate localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
