/**
 * ScoreDisplay Component
 *
 * Shows the player's score in a large, animated card.
 * Used in the result phase of all mini-games.
 *
 * Accessibility: Announces score changes to screen readers via aria-live.
 */

'use client';

import { motion } from 'framer-motion';
import { getScoreColor, getScoreBg } from '@/lib/mini-games/utils';

interface ScoreDisplayProps {
  /** The score value (0-5) */
  score: number;

  /** Maximum possible score */
  maxScore: number;

  /** Color scheme for the score display */
  colorScheme?: 'mint' | 'amber' | 'cyan' | 'violet' | 'glitch';

  /** Optional delay for animation (in seconds) */
  animationDelay?: number;
}

/**
 * Large animated score card
 *
 * Displays the final score with color-coded styling:
 * - Green/high: 80%+ (excellent)
 * - Yellow/medium: 40-79% (good)
 * - Red/low: <40% (needs improvement)
 *
 * Animates in with a spring effect for visual impact.
 */
export function ScoreDisplay({
  score,
  maxScore,
  colorScheme = 'mint',
  animationDelay = 0.2,
}: ScoreDisplayProps) {
  const scoreColorClass = getScoreColor(score, maxScore, colorScheme);
  const scoreBgClass = getScoreBg(score, maxScore, colorScheme);

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', delay: animationDelay }}
      className={`rounded-xl p-8 border-2 ${scoreBgClass} text-center`}
      // Announce score to screen readers
      aria-live="polite"
      aria-label={`You scored ${score} out of ${maxScore} points`}
    >
      {/* "Score" label */}
      <p className="font-mono text-xs text-steel-500 uppercase mb-2 tracking-wider">
        Score
      </p>

      {/* Large score numbers */}
      <p className={`text-6xl font-black ${scoreColorClass}`}>
        {score}/{maxScore}
      </p>
    </motion.div>
  );
}
