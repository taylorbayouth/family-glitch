'use client';

import { motion } from 'framer-motion';
import { SlideToUnlock } from './SlideToUnlock';
import type { Player } from '@/lib/store/player-store';

/**
 * Pass to Player Screen
 *
 * Shown between turns. Gives players privacy and time to pass the device.
 * Also used to preload the next question from the AI while showing this screen.
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
  // Get avatar image path
  const getAvatarPath = (index: number) => `/avatars/${index}.png`;

  return (
    <div className="min-h-screen bg-void flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="scan-line" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-glitch/10 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Turn indicator */}
        {turnNumber && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="font-mono text-xs text-steel-500 uppercase tracking-wider">
              Turn {turnNumber}
            </p>
          </motion.div>
        )}

        {/* Player avatar and name */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="w-36 h-36 rounded-full bg-void-light border-4 border-glitch overflow-hidden shadow-glow">
            <img
              src={getAvatarPath(player.avatar)}
              alt={`${player.name}'s avatar`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-4xl font-black text-frost">
              {player.name}
            </h1>
            <p className="text-steel-400 font-mono text-sm">
              {player.role} · Age {player.age}
            </p>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6 border border-steel-800"
        >
          <p className="text-frost text-center leading-relaxed">
            {isLoadingQuestion ? (
              <>
                The AI is preparing your question...
                <br />
                <span className="text-glitch-bright font-mono text-sm">
                  Hold tight
                </span>
              </>
            ) : (
              <>
                Pass the phone to <span className="text-glitch-bright font-bold">{player.name}</span>
                <br />
                <span className="text-steel-500 text-sm">
                  Make sure nobody else can see the screen!
                </span>
              </>
            )}
          </p>
        </motion.div>

        {/* Slide to unlock */}
        {!isLoadingQuestion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <SlideToUnlock
              onUnlock={onUnlock}
              playerName={player.name}
            />
          </motion.div>
        )}

        {/* Loading indicator */}
        {isLoadingQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center"
          >
            <div className="flex space-x-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full bg-glitch"
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
          </motion.div>
        )}
      </div>

      {/* Warning at bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-8 left-0 right-0 text-center"
      >
        <p className="text-steel-600 font-mono text-xs uppercase tracking-wider">
          Privacy Mode Active
        </p>
      </motion.div>
    </div>
  );
}
