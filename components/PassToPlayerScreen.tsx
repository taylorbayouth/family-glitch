'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Player } from '@/lib/store/player-store';

/**
 * Pass to Player Screen
 *
 * Simple, clean design: Big name + button at bottom with long press interaction
 */
interface PassToPlayerScreenProps {
  player: Player;
  onUnlock: () => void;
  isLoadingQuestion: boolean;
  turnNumber?: number;
}

const HOLD_DURATION = 1200; // 1.2 seconds to unlock

export function PassToPlayerScreen({
  player,
  onUnlock,
  isLoadingQuestion,
}: PassToPlayerScreenProps) {
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handlePointerDown = () => {
    if (isLoadingQuestion) return;

    setIsHolding(true);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);

      setHoldProgress(progress);

      if (progress >= 100) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsHolding(false);
        onUnlock();
      }
    }, 16); // ~60fps
  };

  const handlePointerUp = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsHolding(false);
    setHoldProgress(0);
  };
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
            animate={{
              opacity: 1,
              y: 0,
              scale: isHolding ? 1 + (holdProgress / 100) * 0.1 : 1, // Grows 10% larger
            }}
            transition={{
              opacity: { delay: 0.3 },
              y: { delay: 0.3 },
              scale: { duration: 0.1 },
            }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative w-full font-bold py-4 px-8 rounded-xl text-lg overflow-hidden select-none"
            style={{
              backgroundColor: isHolding
                ? `hsl(${160 + (holdProgress / 100) * 100}, 100%, ${45 + (holdProgress / 100) * 10}%)`
                : '#6c5ce7',
              color: '#e4f3ff',
              boxShadow: isHolding
                ? `0 0 ${20 + holdProgress * 0.3}px rgba(108, 92, 231, ${0.4 + holdProgress * 0.006})`
                : '0 0 20px rgba(108, 92, 231, 0.4)',
            }}
          >
            {/* Progress fill background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-mint/40 to-glitch-bright/40"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: holdProgress / 100 }}
              transition={{ duration: 0.05 }}
              style={{ transformOrigin: 'left' }}
            />

            {/* Button text */}
            <span className="relative z-10">
              {isHolding
                ? holdProgress < 100
                  ? 'Hold...'
                  : "Let's Go!"
                : `I'm ${player.name} — Let's Go`}
            </span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
