'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/gameStore';
import type { Player } from '@/types/game';

interface FinaleScreenProps {
  finale?: {
    winner_id: string;
    recap: string;
    highlights: string[];
  };
  onPlayAgain: () => void;
}

export function FinaleScreen({ finale, onPlayAgain }: FinaleScreenProps) {
  const { gameState } = useGameStore();

  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  // Use AI-generated finale if available, otherwise generate basic one
  const winnerText = finale?.winner_id
    ? gameState.players.find((p) => p.id === finale.winner_id)?.name || winner?.name
    : winner?.name;

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
        <p className="text-cyan-400 uppercase tracking-widest mb-2 text-sm">
          Winner
        </p>
        <motion.div
          className="text-8xl mb-4"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {winner?.avatar}
        </motion.div>
        <motion.h1
          className="text-5xl font-bold glitch-text mb-2"
          animate={{
            textShadow: [
              '3px 0 #ff00ff, -3px 0 #00ffff',
              '-3px 0 #ff00ff, 3px 0 #00ffff',
            ],
          }}
          transition={{ duration: 0.3, repeat: Infinity, repeatType: 'reverse' }}
        >
          {winnerText}
        </motion.h1>
        <p className="text-2xl text-yellow-400">{winner?.score} points</p>
      </motion.div>

      {/* Final Scores */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-8"
      >
        <h2 className="text-lg text-gray-500 uppercase tracking-wide mb-3 text-center">
          Final Scores
        </h2>
        <div className="space-y-2 max-w-md mx-auto">
          {sortedPlayers.map((player, i) => (
            <motion.div
              key={player.id}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className={`flex justify-between items-center p-4 rounded-lg ${
                i === 0
                  ? 'bg-yellow-900/30 border border-yellow-500'
                  : 'bg-gray-900'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="text-gray-500 text-lg">{i + 1}.</span>
                <span className="text-2xl">{player.avatar}</span>
                <span className="font-bold text-lg">{player.name}</span>
                {i === 0 && <span className="text-xl">👑</span>}
              </span>
              <span className="text-2xl font-bold text-cyan-400">
                {player.score}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* AI Recap */}
      {finale?.recap && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mb-8 max-w-2xl mx-auto"
        >
          <h2 className="text-lg text-gray-500 uppercase tracking-wide mb-4 text-center">
            The Glitch's Take
          </h2>
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
            <p className="text-lg text-gray-300 leading-relaxed text-center italic">
              {finale.recap}
            </p>
          </div>
        </motion.div>
      )}

      {/* Highlights */}
      {finale?.highlights && finale.highlights.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mb-8 max-w-2xl mx-auto"
        >
          <h2 className="text-lg text-gray-500 uppercase tracking-wide mb-4 text-center">
            Memorable Moments
          </h2>
          <div className="space-y-3">
            {finale.highlights.map((highlight, i) => (
              <motion.div
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.3 + i * 0.1 }}
                className="bg-gray-900/50 border-l-4 border-cyan-500 p-4 rounded"
              >
                <p className="text-gray-300">{highlight}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Vault Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="mb-8 text-center"
      >
        <p className="text-gray-600 text-sm">
          🔒 {gameState.storage.filter(s => s.scope === 'permanent').length} memories collected
        </p>
      </motion.div>

      {/* Play Again */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onPlayAgain}
        className="w-full max-w-md mx-auto bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-4 rounded-lg text-xl sticky bottom-6"
      >
        PLAY AGAIN
      </motion.button>
    </motion.div>
  );
}
