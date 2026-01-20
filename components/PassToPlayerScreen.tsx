'use client';

import { motion } from 'framer-motion';
import type { Player } from '@/lib/store/player-store';

/**
 * Pass to Player Screen
 *
 * Shown between turns. Full-screen display with big text
 * that scales dynamically to fill available space.
 */
interface PassToPlayerScreenProps {
  player: Player;
  onUnlock: () => void;
  isLoadingQuestion: boolean;
  turnNumber?: number;
}

export function PassToPlayerScreen({
  player,
  onUnlock,
  isLoadingQuestion,
  turnNumber,
}: PassToPlayerScreenProps) {
  return (
    <div className="h-screen bg-void flex flex-col overflow-hidden relative">
      {/* Background effects */}
      <div className="scan-line" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

      {/* Header - Turn badge */}
      {turnNumber && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-4 px-4 flex justify-center"
        >
          <span className="font-mono text-xs text-steel-500 uppercase tracking-widest bg-void-light px-4 py-1.5 rounded-full border border-steel-700">
            Turn {turnNumber}
          </span>
        </motion.div>
      )}

      {/* Main content - fills remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center w-full"
        >
          {isLoadingQuestion ? (
            <>
              <p
                className="text-steel-400 font-mono uppercase tracking-widest mb-4"
                style={{ fontSize: 'clamp(0.7rem, 2vw, 1rem)' }}
              >
                Preparing question...
              </p>
              <div className="flex justify-center space-x-3">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-4 h-4 rounded-full bg-glitch"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              {/* "Pass to" label */}
              <p
                className="text-steel-400 font-mono uppercase tracking-widest mb-2"
                style={{ fontSize: 'clamp(0.8rem, 3vw, 1.2rem)' }}
              >
                Pass to
              </p>

              {/* Player name - big and dynamic */}
              <h1
                className="font-black text-frost leading-none"
                style={{
                  fontSize: 'clamp(3rem, 15vw, 8rem)',
                  textShadow: '0 0 40px rgba(178, 102, 255, 0.3)',
                }}
              >
                {player.name}
              </h1>

              {/* Role subtitle */}
              <p
                className="text-steel-500 font-mono mt-3"
                style={{ fontSize: 'clamp(0.7rem, 2.5vw, 1rem)' }}
              >
                {player.role}
              </p>
            </>
          )}
        </motion.div>
      </div>

      {/* Bottom button area */}
      <div className="px-6 pb-8">
        {!isLoadingQuestion && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={onUnlock}
            className="w-full bg-glitch text-frost font-bold py-4 px-8 rounded-xl transition-all shadow-glow-strong relative overflow-hidden"
            style={{
              fontSize: 'clamp(1rem, 3vw, 1.25rem)',
            }}
          >
            {/* Pulse animation overlay */}
            <motion.div
              className="absolute inset-0 bg-glitch-bright rounded-xl"
              animate={{
                opacity: [0, 0.3, 0],
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Button text */}
            <span className="relative z-10">
              I'm {player.name} — Let's Go
            </span>
          </motion.button>
        )}

        {isLoadingQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full bg-steel-800 text-steel-500 font-bold py-4 px-8 rounded-xl text-center"
            style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}
          >
            Hold tight...
          </motion.div>
        )}
      </div>
    </div>
  );
}
