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
 * Normal block element that sits above content
 */
export function GameHeader({ currentPlayerId, turnNumber, compact = false }: GameHeaderProps) {
  const { players } = usePlayerStore();
  const { scores } = useGameStore();

  const currentPlayer = players.find(p => p.id === currentPlayerId);

  if (!currentPlayer) return null;

  return (
    <div
      className="w-full bg-void border-b border-steel-800"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className={`${compact ? 'p-3' : 'p-4'} space-y-2`}>
        {/* Leaderboard */}
        <div className="max-w-7xl mx-auto">
          <Leaderboard currentPlayerId={currentPlayerId} />
        </div>

        {/* Player info and progress - only show if turnNumber provided */}
        {turnNumber !== undefined && (
          <>
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div>
                <p className="font-mono text-xs text-steel-500 uppercase tracking-wider">
                  Turn {turnNumber}
                </p>
                <h2 className="text-lg font-bold text-frost">{currentPlayer.name}</h2>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs text-steel-500 uppercase tracking-wider">
                  Your Score
                </p>
                <p className="text-xl font-black text-glitch">
                  {scores[currentPlayerId] || 0}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="max-w-7xl mx-auto">
              <GameProgressBar />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
