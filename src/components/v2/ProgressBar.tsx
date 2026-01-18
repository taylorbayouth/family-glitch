'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/gameStore-v2';

export function ProgressBar() {
  const { gameState } = useGameStore();
  const { turn_count, max_turns } = gameState.meta;

  const progress = (turn_count / max_turns) * 100;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Progress bar */}
      <div className="h-1 bg-gray-900">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Turn counter */}
      <div className="absolute top-2 right-4 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-700">
        <span className="text-xs text-gray-400">
          Turn <span className="text-cyan-400 font-bold">{turn_count}</span>
          <span className="text-gray-600">/</span>
          <span className="text-gray-500">{max_turns}</span>
        </span>
      </div>
    </div>
  );
}
