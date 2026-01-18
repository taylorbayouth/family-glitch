'use client';

import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import type { HandoffData } from '@/types/game-v2';

interface TheHandoffProps {
  data: HandoffData;
  onUnlock: () => void;
}

export function TheHandoff({ data, onUnlock }: TheHandoffProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, 200], [0.5, 1]);
  const scale = useTransform(x, [0, 200], [1, 1.1]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    // If dragged far enough to the right, unlock
    if (info.offset.x > 150) {
      setIsUnlocked(true);
      setTimeout(() => {
        onUnlock();
      }, 600);
    } else {
      // Spring back
      x.set(0);
    }
  };

  if (!data.require_unlock) {
    // Simple tap to continue
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-b from-purple-900 via-black to-black text-white flex flex-col items-center justify-center p-6 cursor-pointer"
        onClick={onUnlock}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="text-8xl mb-8"
        >
          {data.next_player_avatar}
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-5xl font-bold text-center mb-4 glitch-text"
        >
          PASS TO
        </motion.h1>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-6xl font-bold text-center text-cyan-400 mb-8"
        >
          {data.next_player_name.toUpperCase()}
        </motion.h2>

        {data.hint && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-400 text-center text-lg italic"
          >
            "{data.hint}"
          </motion.p>
        )}

        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-20 text-gray-500 text-sm"
        >
          TAP ANYWHERE TO CONTINUE
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-purple-900 via-black to-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden"
    >
      {/* Animated background */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute inset-0 bg-gradient-radial from-cyan-500/20 to-transparent"
      />

      {/* Player Avatar */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 0.8 }}
        className="text-9xl mb-8 relative z-10"
      >
        {data.next_player_avatar}
      </motion.div>

      {/* Pass To Text */}
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-bold text-center mb-2"
      >
        PASS TO
      </motion.h1>

      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-7xl font-bold text-center text-cyan-400 mb-12"
        style={{
          textShadow: '0 0 30px rgba(0, 255, 255, 0.5)',
        }}
      >
        {data.next_player_name.toUpperCase()}
      </motion.h2>

      {data.hint && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-400 text-center text-lg italic mb-16"
        >
          "{data.hint}"
        </motion.p>
      )}

      {/* Slide to Unlock */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-sm relative z-10"
        ref={constraintsRef}
      >
        <div className="relative h-20 bg-gray-900/50 rounded-full border-2 border-cyan-500/30 overflow-hidden">
          {/* Background track */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-transparent"
            style={{ scaleX: useTransform(x, [0, 250], [0, 1]) }}
          />

          {/* Slide text */}
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-lg font-bold pointer-events-none">
            <motion.span style={{ opacity: useTransform(x, [0, 150], [1, 0]) }}>
              SLIDE TO UNLOCK →
            </motion.span>
          </div>

          {/* Draggable slider */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 250 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            style={{ x, opacity, scale }}
            className="absolute left-2 top-2 w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/50"
            whileTap={{ scale: 1.1 }}
          >
            {isUnlocked ? '✅' : '👉'}
          </motion.div>
        </div>

        {/* Helper text */}
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-center text-gray-600 text-sm mt-4"
        >
          {data.next_player_name}, this is for your eyes only
        </motion.p>
      </motion.div>

      {/* Unlocking animation */}
      {isUnlocked && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center"
        >
          <div className="text-9xl">🔓</div>
        </motion.div>
      )}
    </motion.div>
  );
}
