/**
 * CommentaryCard Component
 *
 * Displays AI-generated commentary about the player's performance.
 * Used in the result phase of all mini-games.
 */

'use client';

import { motion } from 'framer-motion';

interface CommentaryCardProps {
  /** AI-generated commentary text */
  commentary: string;

  /** Emoji to display before the commentary */
  emoji: string;

  /** Optional animation delay (in seconds) */
  animationDelay?: number;
}

/**
 * AI commentary display card
 *
 * Shows the AI's witty or encouraging feedback about the player's performance.
 * Includes an emoji and smooth fade-in animation.
 */
export function CommentaryCard({
  commentary,
  emoji,
  animationDelay = 0.4,
}: CommentaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
      className="glass rounded-xl p-6 border border-steel-800"
    >
      <div className="flex items-start gap-3">
        {/* Emoji icon */}
        <span className="text-2xl flex-shrink-0" aria-hidden="true">
          {emoji}
        </span>

        {/* Commentary text */}
        <p className="text-frost text-lg leading-relaxed">
          {commentary}
        </p>
      </div>
    </motion.div>
  );
}
