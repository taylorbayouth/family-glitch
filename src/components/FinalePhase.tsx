'use client';

import { motion } from 'framer-motion';
import type { Player } from '@/types/game';

interface FinalePhaseProps {
  poem: string;
  players: Record<string, Player>;
  onPlayAgain: () => void;
}

export function FinalePhase({ poem, players, onPlayAgain }: FinalePhaseProps) {
  const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  const poemLines = poem.split('\n').filter((line) => line.trim());

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black text-white flex flex-col p-6 overflow-y-auto"
    >
      {/* Winner Announcement */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="text-center mb-8"
      >
        <p className="text-cyan-400 uppercase tracking-widest mb-2">
          The Winner Is
        </p>
        <motion.h1
          className="text-5xl font-bold glitch-text"
          animate={{
            textShadow: [
              '3px 0 #ff00ff, -3px 0 #00ffff',
              '-3px 0 #ff00ff, 3px 0 #00ffff',
            ],
          }}
          transition={{ duration: 0.3, repeat: Infinity, repeatType: 'reverse' }}
        >
          {winner?.name} 🏆
        </motion.h1>
        <p className="text-2xl text-yellow-400 mt-2">{winner?.score} pts</p>
      </motion.div>

      {/* Scoreboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-8"
      >
        <h2 className="text-lg text-gray-500 uppercase tracking-wide mb-3">
          Final Scores
        </h2>
        <div className="space-y-2">
          {sortedPlayers.map((player, i) => (
            <motion.div
              key={player.name}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className={`flex justify-between items-center p-3 rounded-lg ${
                i === 0
                  ? 'bg-yellow-900/30 border border-yellow-500'
                  : 'bg-gray-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-gray-500">{i + 1}.</span>
                <span className="font-bold">{player.name}</span>
                {i === 0 && <span>👑</span>}
              </span>
              <span className="text-xl font-bold text-cyan-400">
                {player.score}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* The Roast Poem */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex-1 mb-8"
      >
        <h2 className="text-lg text-gray-500 uppercase tracking-wide mb-4 text-center">
          📜 The Glitch&apos;s Final Verdict 📜
        </h2>
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
          {poemLines.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 + i * 0.15 }}
              className="text-lg text-gray-300 italic mb-2 leading-relaxed"
            >
              {line}
            </motion.p>
          ))}
        </div>
      </motion.div>

      {/* Play Again */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onPlayAgain}
        className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-4 rounded-lg text-xl"
      >
        PLAY AGAIN
      </motion.button>
    </motion.div>
  );
}
