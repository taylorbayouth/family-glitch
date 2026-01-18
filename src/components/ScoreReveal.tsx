'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ScoreEvent } from '@/types/game';

interface ScoreRevealProps {
  scoreEvent: ScoreEvent;
  playerName: string;
  playerAvatar: string;
  onContinue: () => void;
}

export function ScoreReveal({
  scoreEvent,
  playerName,
  playerAvatar,
  onContinue,
}: ScoreRevealProps) {
  const [displayPoints, setDisplayPoints] = useState(0);
  const [displayBonus, setDisplayBonus] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const totalPoints = scoreEvent.points + scoreEvent.bonus;

  // Count up animation for points
  useEffect(() => {
    const duration = 1500;
    const steps = 30;
    const increment = scoreEvent.points / steps;
    let current = 0;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      current += increment;

      if (step >= steps) {
        setDisplayPoints(scoreEvent.points);
        clearInterval(interval);

        // Start bonus count after main points
        if (scoreEvent.bonus > 0) {
          setTimeout(() => {
            setDisplayBonus(scoreEvent.bonus);
            setShowConfetti(true);
          }, 300);
        }
      } else {
        setDisplayPoints(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [scoreEvent.points, scoreEvent.bonus]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black text-white flex flex-col p-6 relative overflow-hidden"
    >
      {/* Confetti effect for bonus */}
      <AnimatePresence>
        {showConfetti && (
          <>
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: '50%',
                  y: '30%',
                  scale: 0,
                  rotate: 0
                }}
                animate={{
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  scale: [0, 1, 1, 0],
                  rotate: Math.random() * 360,
                }}
                transition={{
                  duration: 2,
                  ease: 'easeOut',
                  delay: i * 0.05,
                }}
                className="absolute w-4 h-4 rounded-full"
                style={{
                  background: ['#00ffff', '#ff00ff', '#ffff00', '#00ff00'][i % 4],
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        {/* Player Info */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="text-8xl mb-4"
        >
          {playerAvatar}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold mb-8"
        >
          {playerName}
        </motion.h2>

        {/* Score Display - Slot Machine Style */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-8xl font-bold text-cyan-400 mb-2"
            style={{
              textShadow: '0 0 40px rgba(0, 255, 255, 0.6)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            +{displayPoints}
          </motion.div>

          {/* Bonus Badge */}
          <AnimatePresence>
            {displayBonus > 0 && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', duration: 0.6 }}
                className="inline-block"
              >
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-6 py-2 rounded-full font-bold text-2xl">
                  🔥 BONUS +{displayBonus}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reason */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="max-w-md text-center"
        >
          <p className="text-xl text-gray-300 leading-relaxed">
            {scoreEvent.reason}
          </p>
        </motion.div>

        {/* Total Score Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="mt-12 text-gray-500"
        >
          Total Earned: <span className="text-white font-bold">{totalPoints}</span> points
        </motion.div>
      </div>

      {/* Continue Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8 }}
        whileTap={{ scale: 0.95 }}
        onClick={onContinue}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-lg text-xl relative overflow-hidden"
      >
        <motion.div
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 opacity-50"
          style={{ backgroundSize: '200% 100%' }}
        />
        <span className="relative z-10">CONTINUE</span>
      </motion.button>
    </motion.div>
  );
}
