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
 * Fixed game header showing leaderboard, current player info, and progress
 * Always visible at the top of the screen
 */
export function GameHeader({ currentPlayerId, turnNumber, compact = false }: GameHeaderProps) {
  const { players } = usePlayerStore();
  const { scores } = useGameStore();

  const currentPlayer = players.find(p => p.id === currentPlayerId);

  if (!currentPlayer) return null;

  return (
    <>
      {/* Fixed header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-void/95 backdrop-blur-md border-b border-steel-800">
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
      {/* Spacer to prevent content from being hidden under fixed header */}
      <div className={turnNumber !== undefined ? 'h-36' : 'h-16'} />
    </>
  );
}
