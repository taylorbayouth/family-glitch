'use client';

import { motion } from 'framer-motion';
import type { Player } from '@/lib/store/player-store';

/**
 * Pass to Player Screen
 *
 * Simple, clean design: Big name + button at bottom
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
}: PassToPlayerScreenProps) {
  return (
    <div
      className="min-h-dvh bg-void flex flex-col relative"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Background effects */}
      <div className="scan-line" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />

      {/* Main content - flex-1 pushes button to bottom when content is short */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          {isLoadingQuestion ? (
            <>
              <p className="text-steel-400 font-mono uppercase tracking-widest mb-6 text-lg">
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
            <h1
              className="font-black text-frost leading-none"
              style={{
                fontSize: 'clamp(3rem, 15vw, 8rem)',
                textShadow: '0 0 60px rgba(108, 92, 231, 0.4)',
              }}
            >
              {player.name}
            </h1>
          )}
        </motion.div>
      </div>

      {/* Bottom button - flex-shrink-0 keeps it from shrinking */}
      <div
        className="flex-shrink-0 px-6 pb-6 relative z-10"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
      >
        {isLoadingQuestion ? (
          <div className="w-full bg-steel-800 text-steel-500 font-bold py-4 px-8 rounded-xl text-center text-lg">
            Hold tight...
          </div>
        ) : (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={onUnlock}
            className="w-full bg-glitch text-frost font-bold py-4 px-8 rounded-xl text-lg shadow-glow-strong active:scale-[0.98] transition-transform"
          >
            I'm {player.name} — Let's Go
          </motion.button>
        )}
      </div>
    </div>
  );
}
