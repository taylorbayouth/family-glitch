'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TimedBinaryParams } from '@/lib/types/template-params';

/**
 * The Binary Choice (tpl_timed_binary)
 *
 * Purpose: High-pressure "This or That" decisions (e.g., "Pizza or Tacos?")
 *
 * Features:
 * - Two massive buttons filling available space
 * - Progress bar timer at the top
 * - Instant submit on tap (no confirmation)
 * - NEVER scrolls - fixed viewport height
 */
export function TimedBinaryTemplate({
  prompt,
  subtitle,
  leftText,
  rightText,
  seconds,
  orientation = 'vertical',
  onSubmit,
  onTimeout,
}: TimedBinaryParams) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [hasSelected, setHasSelected] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (hasSelected) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [hasSelected]);

  // Handle timeout separately to avoid setState during render
  useEffect(() => {
    if (!hasSelected && timeLeft <= 0) {
      const timeoutId = setTimeout(() => {
        setHasSelected(true);
        onTimeout?.();
        onSubmit({ choice: null, timedOut: true });
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [timeLeft, hasSelected, onSubmit, onTimeout]);

  const handleChoice = (choice: 'left' | 'right') => {
    if (!hasSelected) {
      setHasSelected(true);
      onSubmit({
        choice,
        selectedText: choice === 'left' ? leftText : rightText,
        timeRemaining: timeLeft,
        timedOut: false,
      });
    }
  };

  const progressPercent = (timeLeft / seconds) * 100;
  const timerColor =
    progressPercent > 50
      ? 'var(--glitch)'
      : progressPercent > 25
      ? 'var(--glitch-bright)'
      : 'var(--alert)';

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Timer Bar */}
      <div className="w-full h-2 bg-steel-900 relative overflow-hidden flex-shrink-0">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: `${progressPercent}%` }}
          className={`h-full ${
            progressPercent > 50
              ? 'bg-glitch'
              : progressPercent > 25
              ? 'bg-glitch-bright'
              : 'bg-alert'
          }`}
          style={{ transition: 'width 0.1s linear' }}
        />
      </div>

      {/* Header: Timer + Prompt - compact */}
      <div className="flex-shrink-0 px-4 pt-2 pb-1 text-center">
        <motion.span
          key={Math.floor(timeLeft)}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="font-mono text-2xl font-black inline-block"
          style={{ color: timerColor }}
        >
          {Math.ceil(timeLeft)}
        </motion.span>
        <h2
          className="font-black text-frost leading-tight mt-1"
          style={{ fontSize: 'clamp(1rem, 4vw, 1.5rem)' }}
        >
          {prompt}
        </h2>
        {subtitle && (
          <p
            className="text-steel-400 font-mono mt-0.5"
            style={{ fontSize: 'clamp(0.65rem, 2vw, 0.75rem)' }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Choice Buttons - fill ALL remaining space */}
      <div
        className={`flex-1 flex ${
          orientation === 'horizontal' ? 'flex-row' : 'flex-col'
        } gap-3 p-3 min-h-0 overflow-hidden`}
      >
        {/* Left/Top Option */}
        <motion.button
          onClick={() => handleChoice('left')}
          disabled={hasSelected}
          whileTap={{ scale: 0.97 }}
          className="flex-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-glitch/30 to-glitch/10 border-3 border-glitch hover:border-glitch-bright transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="absolute inset-0 bg-glitch/0 group-hover:bg-glitch/10 transition-all" />
          <div className="relative z-10 h-full flex items-center justify-center p-3">
            <span
              className="font-black text-frost text-center leading-tight"
              style={{ fontSize: 'clamp(1.5rem, 8vw, 3rem)' }}
            >
              {leftText}
            </span>
          </div>
        </motion.button>

        {/* Right/Bottom Option */}
        <motion.button
          onClick={() => handleChoice('right')}
          disabled={hasSelected}
          whileTap={{ scale: 0.97 }}
          className="flex-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-frost/30 to-frost/10 border-3 border-frost hover:border-glitch-bright transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="absolute inset-0 bg-frost/0 group-hover:bg-frost/10 transition-all" />
          <div className="relative z-10 h-full flex items-center justify-center p-3">
            <span
              className="font-black text-frost text-center leading-tight"
              style={{ fontSize: 'clamp(1.5rem, 8vw, 3rem)' }}
            >
              {rightText}
            </span>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
