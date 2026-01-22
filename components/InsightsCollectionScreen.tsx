'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Player } from '@/lib/store/player-store';

/**
 * Insights Collection Screen
 *
 * Shown at the end of Act 1 to collect personalized insights from each player.
 * Similar to PassToPlayerScreen but with special messaging about the transition.
 */
interface InsightsCollectionScreenProps {
  player: Player;
  onUnlock: () => void;
  transitionMessage: string;
  isFirst: boolean;
}

const HOLD_DURATION = 1200; // 1.2 seconds to unlock

export function InsightsCollectionScreen({
  player,
  onUnlock,
  transitionMessage,
  isFirst,
}: InsightsCollectionScreenProps) {
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

    // Animate progress back to 0 instead of instant reset
    const currentProgress = holdProgress;
    const steps = 10;
    const decrement = currentProgress / steps;
    let step = 0;

    const resetInterval = setInterval(() => {
      step++;
      const newProgress = Math.max(0, currentProgress - (decrement * step));
      setHoldProgress(newProgress);

      if (step >= steps) {
        clearInterval(resetInterval);
        setHoldProgress(0);
      }
    }, 20);
  };

  return (
    <div
      className="min-h-dvh bg-void flex flex-col relative"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />

      {/* Transition banner - only shown for first player */}
      {isFirst && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 px-6 pt-8"
        >
          <div className="bg-gradient-to-r from-glitch/20 to-mint/20 border border-glitch/30 rounded-xl p-4 text-center">
            <p className="text-mint font-mono text-sm uppercase tracking-wider mb-1">
              Act 1 Complete
            </p>
            <p className="text-frost text-lg font-medium">
              {transitionMessage}
            </p>
          </div>
        </motion.div>
      )}

      {/* Main content - flex-1 pushes button to bottom when content is short */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <p className="text-steel-400 font-mono uppercase tracking-widest mb-4 text-sm">
            One quick question for
          </p>
          <h1
            className="font-black text-frost leading-none"
            style={{
              fontSize: 'clamp(3rem, 15vw, 8rem)',
              textShadow: '0 0 60px rgba(108, 92, 231, 0.4)',
            }}
          >
            {player.name}
          </h1>
        </motion.div>
      </div>

      {/* Bottom button - flex-shrink-0 keeps it from shrinking */}
      <div
        className="flex-shrink-0 px-6 pb-6 relative z-10"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: isHolding ? 1 + (holdProgress / 100) * 0.1 : 1,
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
                : 'Ready!'
              : `I'm ${player.name}`}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
