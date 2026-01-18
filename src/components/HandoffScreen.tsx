'use client';

import { motion } from 'framer-motion';

interface HandoffScreenProps {
  playerName: string;
  message?: string;
  onReady: () => void;
}

export function HandoffScreen({ playerName, message, onReady }: HandoffScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="text-center"
      >
        <p className="text-cyan-400 text-lg mb-4 uppercase tracking-widest">
          Pass the phone to
        </p>
        <motion.h1
          className="text-5xl font-bold mb-6 glitch-text"
          animate={{
            textShadow: [
              '3px 0 #ff00ff, -3px 0 #00ffff',
              '-3px 0 #ff00ff, 3px 0 #00ffff',
            ],
          }}
          transition={{ duration: 0.2, repeat: Infinity, repeatType: 'reverse' }}
        >
          {playerName}
        </motion.h1>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 text-lg max-w-xs mx-auto mb-8"
          >
            {message}
          </motion.p>
        )}
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        whileTap={{ scale: 0.95 }}
        onClick={onReady}
        className="w-full max-w-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-lg text-xl"
      >
        I&apos;M READY
      </motion.button>
    </motion.div>
  );
}
