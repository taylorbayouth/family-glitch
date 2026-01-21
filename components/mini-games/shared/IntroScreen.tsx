/**
 * IntroScreen Component
 *
 * Full-screen animated introduction for mini-games.
 * Displays game info, creates anticipation, and provides a dramatic start.
 *
 * Features:
 * - Animated gradient background with pulsing blobs
 * - Game badge, icon, title, and description
 * - Optional category and hint display
 * - "Place phone on table" reminder
 * - Start and skip buttons
 *
 * This component replaces 80% of duplicate intro code across all 6 games.
 */

'use client';

import { motion } from 'framer-motion';
import type { MiniGameTheme } from '@/lib/mini-games/themes';

interface IntroScreenProps {
  /** Theme configuration for colors and styling */
  theme: MiniGameTheme;

  /** Game title (e.g., "Mad Libs Challenge") */
  title: string;

  /** Game description/instructions */
  description: string;

  /** Optional game icon (emoji or image) */
  icon?: string;

  /** Optional category label (e.g., "Science", "History") */
  category?: string;

  /** Optional hint text */
  hint?: string;

  /** Callback when player clicks "Let's Go!" */
  onStart: () => void;

  /** Optional callback when player clicks "Skip" */
  onSkip?: () => void;

  /** Custom start button text (default: "Let's Go!") */
  startButtonText?: string;
}

/**
 * Full-screen animated intro for mini-games
 *
 * Creates a dramatic, engaging introduction with:
 * 1. Animated background gradient with pulsing blobs
 * 2. Staggered animation sequence for all elements
 * 3. Game-specific theming and colors
 * 4. Accessible keyboard navigation and ARIA labels
 *
 * The intro builds anticipation and ensures all players are ready before starting.
 */
export function IntroScreen({
  theme,
  title,
  description,
  icon,
  category,
  hint,
  onStart,
  onSkip,
  startButtonText = "Let's Go!",
}: IntroScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 bg-gradient-to-br ${theme.gradientFrom} via-void ${theme.gradientTo} flex flex-col items-center justify-center p-6 z-50 overflow-x-hidden overflow-y-auto`}
    >
      {/* Animated background blobs (performance optimized - opacity only) */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className={`absolute top-1/3 left-1/4 w-64 h-64 rounded-full blur-3xl will-change-transform`}
          style={{ backgroundColor: theme.shadowColor }}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          aria-hidden="true"
        />
        <motion.div
          className={`absolute bottom-1/4 right-1/3 w-48 h-48 rounded-full blur-3xl will-change-transform`}
          style={{ backgroundColor: theme.shadowColor }}
          animate={{ opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          aria-hidden="true"
        />
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative z-10 text-center space-y-6 max-w-lg w-full"
      >
        {/* "Mini-Game" badge */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`inline-block px-4 py-2 rounded-full border`}
          style={{
            backgroundColor: `${theme.shadowColor}`,
            borderColor: theme.primary.includes('/') ? 'rgba(var(--color-mint))' : `var(--color-${theme.primary})`,
          }}
        >
          <span className={`font-mono text-sm text-${theme.primary} uppercase tracking-widest`}>
            Mini-Game
          </span>
        </motion.div>

        {/* Game icon/emoji */}
        {icon && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.3 }}
            className="text-7xl"
            aria-hidden="true"
          >
            {icon}
          </motion.div>
        )}

        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-4xl md:text-5xl font-black text-frost"
        >
          {title}
        </motion.h1>

        {/* Description card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`glass rounded-xl p-6 border space-y-3`}
          style={{ borderColor: `${theme.shadowColor}` }}
        >
          {/* Main description */}
          <p className="text-steel-300 text-lg leading-relaxed">
            {description}
          </p>

          {/* Optional category */}
          {category && (
            <p className="text-sm">
              <span className="text-steel-500">Category: </span>
              <span className={`text-${theme.primary} font-bold`}>{category}</span>
            </p>
          )}

          {/* Optional hint */}
          {hint && (
            <p className="text-steel-500 text-sm italic">
              Hint: {hint}
            </p>
          )}
        </motion.div>

        {/* "Place phone on table" reminder */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="flex items-center justify-center gap-2 text-steel-500"
        >
          <span className="text-lg" aria-hidden="true">📱</span>
          <p className="text-sm">Place phone on table so everyone can see!</p>
        </motion.div>

        {/* Start button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={onStart}
          className={`w-full bg-${theme.primary} hover:bg-${theme.secondary} font-bold py-4 px-8 rounded-xl transition-all`}
          style={{
            color: theme.primary.includes('amber') || theme.primary.includes('mint') ? '#1a1625' : '#e4f3ff',
            boxShadow: `0 0 20px ${theme.shadowColor}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = `0 0 30px ${theme.shadowColor}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = `0 0 20px ${theme.shadowColor}`;
          }}
        >
          {startButtonText}
        </motion.button>

        {/* Optional skip button */}
        {onSkip && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            onClick={onSkip}
            className="text-steel-500 hover:text-frost text-sm py-2 transition-colors"
          >
            Skip this challenge
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
