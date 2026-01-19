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
 * - Two massive buttons (left/right or top/bottom)
 * - Progress bar timer at the top
 * - Instant submit on tap (no confirmation)
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
      // Use setTimeout to defer submission to next tick
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

  return (
    <div className="min-h-screen bg-void flex flex-col">
      {/* Timer Bar - "The Fuse" */}
      <div className="w-full h-2 bg-steel-900 relative overflow-hidden">
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

      {/* Timer Display */}
      <div className="px-6 py-4 text-center">
        <motion.div
          key={Math.floor(timeLeft)}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="font-mono text-4xl font-black"
          style={{
            color:
              progressPercent > 50
                ? 'var(--glitch)'
                : progressPercent > 25
                ? 'var(--glitch-bright)'
                : 'var(--alert)',
          }}
        >
          {Math.ceil(timeLeft)}
        </motion.div>
      </div>

      {/* Prompt */}
      <div className="px-6 py-4 text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-black text-frost">
          {prompt}
        </h2>
        {subtitle && (
          <p className="text-steel-400 text-sm font-mono">{subtitle}</p>
        )}
      </div>

      {/* Choice Buttons */}
      <div
        className={`flex-1 flex ${
          orientation === 'horizontal' ? 'flex-row' : 'flex-col'
        } gap-4 p-4`}
      >
        {/* Left/Top Option */}
        <motion.button
          onClick={() => handleChoice('left')}
          disabled={hasSelected}
          whileTap={{ scale: 0.95 }}
          className="flex-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-glitch/20 to-glitch/5 border-2 border-glitch hover:border-glitch-bright transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {/* Glow effect on hover */}
          <div className="absolute inset-0 bg-glitch/0 group-hover:bg-glitch/10 transition-all" />

          <div className="relative z-10 h-full flex items-center justify-center p-8">
            <span className="text-2xl md:text-4xl font-black text-frost text-center">
              {leftText}
            </span>
          </div>
        </motion.button>

        {/* Right/Bottom Option */}
        <motion.button
          onClick={() => handleChoice('right')}
          disabled={hasSelected}
          whileTap={{ scale: 0.95 }}
          className="flex-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-frost/20 to-frost/5 border-2 border-frost hover:border-glitch-bright transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {/* Glow effect on hover */}
          <div className="absolute inset-0 bg-frost/0 group-hover:bg-frost/10 transition-all" />

          <div className="relative z-10 h-full flex items-center justify-center p-8">
            <span className="text-2xl md:text-4xl font-black text-frost text-center">
              {rightText}
            </span>
          </div>
        </motion.button>
      </div>

      {/* Hint */}
      <div className="px-6 pb-6 text-center">
        <p className="text-steel-600 text-xs font-mono">
          Choose quickly! Timer is running...
        </p>
      </div>
    </div>
  );
}
