'use client';

import { motion } from 'framer-motion';
import type { ScoreUpdate } from '@/types/game';

interface JudgmentPhaseProps {
  title: string;
  message: string;
  scoreUpdates?: ScoreUpdate[];
  onContinue: () => void;
}

export function JudgmentPhase({
  title,
  message,
  scoreUpdates,
  onContinue,
}: JudgmentPhaseProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black text-white flex flex-col p-6"
    >
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="text-6xl mb-6"
        >
          ⚖️
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold mb-4 glitch-text"
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xl text-gray-300 max-w-sm mb-8"
        >
          {message}
        </motion.p>

        {scoreUpdates && scoreUpdates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-4 w-full max-w-sm"
          >
            {scoreUpdates.map((update, i) => (
              <motion.div
                key={i}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8 + i * 0.2 }}
                className={`p-4 rounded-lg ${
                  update.points >= 0
                    ? 'bg-green-900/50 border border-green-500'
                    : 'bg-red-900/50 border border-red-500'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold">{update.player}</span>
                  <span
                    className={`text-2xl font-bold ${
                      update.points >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {update.points >= 0 ? '+' : ''}
                    {update.points}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">{update.reason}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onContinue}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-lg text-xl"
      >
        CONTINUE
      </motion.button>
    </motion.div>
  );
}
