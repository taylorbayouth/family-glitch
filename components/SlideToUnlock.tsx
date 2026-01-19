'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

/**
 * Slide to Unlock Component
 *
 * A swipeable slider that reveals content when fully slid to the right.
 * Used in the "Pass to Player" flow to prevent accidental reveals.
 */
interface SlideToUnlockProps {
  onUnlock: () => void;
  playerName: string;
}

export function SlideToUnlock({ onUnlock, playerName }: SlideToUnlockProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  // Track dimensions
  const [trackWidth, setTrackWidth] = useState(0);
  const thumbWidth = 80;
  const maxDrag = trackWidth - thumbWidth;

  // Calculate progress (0 to 1)
  const progress = useTransform(x, [0, maxDrag], [0, 1]);

  // Opacity for the instruction text
  const textOpacity = useTransform(x, [0, maxDrag * 0.5], [1, 0]);

  useEffect(() => {
    const updateDimensions = () => {
      if (constraintsRef.current) {
        setTrackWidth(constraintsRef.current.offsetWidth);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const dragProgress = info.point.x / maxDrag;

    if (dragProgress > 0.8) {
      // Unlocked!
      setIsUnlocked(true);
      setTimeout(() => {
        onUnlock();
      }, 300);
    } else {
      // Snap back
      x.set(0);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-6">
      {/* Instructions */}
      <motion.p
        style={{ opacity: textOpacity }}
        className="text-center text-frost font-mono text-sm mb-4"
      >
        Slide to reveal your question
      </motion.p>

      {/* Track */}
      <div
        ref={constraintsRef}
        className="relative h-16 bg-void-light border-2 border-steel-800 rounded-full overflow-hidden"
      >
        {/* Progress fill */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-glitch/20 to-glitch/40"
          style={{
            scaleX: progress,
            transformOrigin: 'left',
          }}
        />

        {/* Instruction text on track */}
        <motion.div
          style={{ opacity: textOpacity }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <p className="font-bold text-frost/50 text-sm">
            Swipe to unlock →
          </p>
        </motion.div>

        {/* Draggable thumb */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: maxDrag }}
          dragElastic={0.1}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          style={{
            x,
            width: thumbWidth,
          }}
          animate={isUnlocked ? { scale: 1.1, opacity: 0 } : {}}
          className="absolute top-1 left-1 h-14 rounded-full bg-glitch flex items-center justify-center shadow-glow cursor-grab active:cursor-grabbing"
          whileTap={{ scale: 0.95 }}
        >
          <svg
            className="w-6 h-6 text-void"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </motion.div>
      </div>

      {/* Unlocked state */}
      {isUnlocked && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-glitch-bright font-bold mt-4"
        >
          Unlocked! Loading your question...
        </motion.p>
      )}
    </div>
  );
}
