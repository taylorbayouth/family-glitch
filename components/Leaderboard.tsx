'use client';

import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import Image from 'next/image';
import { usePlayerStore, type Player } from '@/lib/store/player-store';
import { useGameStore } from '@/lib/store/game-store';

interface LeaderboardProps {
  currentPlayerId?: string;
}

interface RankedPlayer extends Player {
  score: number;
  rank: number;
}

export function Leaderboard({ currentPlayerId }: LeaderboardProps) {
  const players = usePlayerStore((state) => state.players);
  const scores = useGameStore((state) => state.scores);

  // Sort players by score descending and assign ranks
  const rankedPlayers: RankedPlayer[] = players
    .map((player) => ({
      ...player,
      score: scores[player.id] || 0,
      rank: 0,
    }))
    .sort((a, b) => b.score - a.score)
    .map((player, index) => ({
      ...player,
      rank: index + 1,
    }));

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `${rank}th`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-amber-400';
    if (rank === 2) return 'text-steel-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-steel-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full glass rounded-xl p-3 mb-4"
    >
      <LayoutGroup>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <AnimatePresence mode="popLayout">
            {rankedPlayers.map((player) => {
              const isCurrent = player.id === currentPlayerId;

              return (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    layout: { type: 'spring', stiffness: 400, damping: 30 },
                    opacity: { duration: 0.2 },
                  }}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg
                    ${isCurrent
                      ? 'bg-glitch/20 ring-2 ring-glitch shadow-glow'
                      : 'bg-void-800/50'
                    }
                    transition-colors duration-300
                  `}
                >
                  {/* Rank */}
                  <span className={`text-xs font-bold ${getRankColor(player.rank)}`}>
                    {getRankDisplay(player.rank)}
                  </span>

                  {/* Avatar */}
                  <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-void-700">
                    <Image
                      src={`/avatars/${player.avatar}.png`}
                      alt={player.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Name */}
                  <span className={`text-sm font-medium ${isCurrent ? 'text-frost' : 'text-steel-300'}`}>
                    {player.name}
                  </span>

                  {/* Score */}
                  <motion.span
                    key={player.score}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className="text-sm font-black text-glitch min-w-[2rem] text-right"
                  >
                    {player.score}
                  </motion.span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </motion.div>
  );
}
