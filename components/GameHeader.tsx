'use client';

import { Leaderboard } from './Leaderboard';
import { GameProgressBar } from './GameProgressBar';
import { usePlayerStore, useGameStore } from '@/lib/store';

interface GameHeaderProps {
  currentPlayerId: string;
  turnNumber?: number;
  compact?: boolean;
}

/**
 * Game header showing leaderboard, current player info, and progress
 * Should be used inside a flex column container - takes natural height
 */
export function GameHeader({ currentPlayerId, turnNumber, compact = false }: GameHeaderProps) {
  const { players } = usePlayerStore();
  const { scores } = useGameStore();

  const currentPlayer = players.find(p => p.id === currentPlayerId);

  if (!currentPlayer) return null;

  return (
    <header className="shrink-0 bg-void">
      <div className={`${compact ? 'px-3 pt-2' : 'px-4 pt-2'} space-y-2`}>
        {/* Leaderboard */}
        <div className="max-w-7xl mx-auto">
          <Leaderboard currentPlayerId={currentPlayerId} />
        </div>

        {/* Progress Bar - only show if turnNumber provided */}
        {turnNumber !== undefined && (
          <div className="max-w-7xl mx-auto pb-1">
            <GameProgressBar />
          </div>
        )}
      </div>
    </header>
  );
}
