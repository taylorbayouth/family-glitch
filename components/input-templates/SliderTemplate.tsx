'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SliderParams } from '@/lib/types/template-params';

/**
 * The Spectrum (tpl_slider)
 *
 * Purpose: Nuanced ratings (e.g., "How hungry is Mom? 0 to 10")
 *
 * Features:
 * - Thick horizontal track
 * - Large draggable thumb
 * - Dynamic labels/emojis that change with value
 * - Confirm button appears below
 */
export function SliderTemplate({
  prompt,
  subtitle,
  min,
  max,
  step = 1,
  defaultValue,
  minLabel,
  maxLabel,
  valueEmojis,
  showValue = true,
  onSubmit,
}: SliderParams) {
  // Start with middle value visually, but track if user has interacted
  const [value, setValue] = useState(defaultValue ?? Math.floor((min + max) / 2));
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate percentage for visual representation
  const percentage = ((value - min) / (max - min)) * 100;

  // Get emoji for current value
  const currentEmoji = valueEmojis?.[value];

  const handleSubmit = () => {
    onSubmit({
      value,
      min,
      max,
      label: currentEmoji || value.toString(),
    });
  };

  return (
    <div className="min-h-dvh bg-void flex flex-col safe-y">
      {/* Content - top aligned with spacing */}
      <div className="flex-1 flex flex-col px-6 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl space-y-8"
        >
          {/* Prompt */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-frost">
              {prompt}
            </h2>
            {subtitle && (
              <p className="text-steel-400 text-sm md:text-base font-mono">
                {subtitle}
              </p>
            )}
          </div>

          {/* Value Display */}
          <div className="text-center">
            <motion.div
              key={value}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: isDragging ? 1.2 : 1,
                opacity: 1,
              }}
              transition={{ duration: 0.2 }}
              className="inline-block"
            >
              {currentEmoji ? (
                <div className="text-6xl md:text-8xl">{currentEmoji}</div>
              ) : showValue ? (
                <div className="text-6xl md:text-8xl font-black text-glitch">
                  {value}
                </div>
              ) : null}
            </motion.div>
          </div>

          {/* Slider Track */}
          <div className="space-y-4">
            <div className="relative px-4">
              {/* Track Background */}
              <div className="h-4 bg-steel-900 rounded-full relative overflow-hidden">
                {/* Filled portion */}
                <motion.div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-glitch/50 to-glitch rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Slider Input (invisible but functional) */}
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => {
                  setValue(Number(e.target.value));
                  setHasInteracted(true);
                }}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onTouchStart={() => setIsDragging(true)}
                onTouchEnd={() => setIsDragging(false)}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              {/* Thumb */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-glitch border-4 border-void shadow-glow pointer-events-none"
                style={{ left: `calc(${percentage}% - 20px)` }}
                animate={{
                  scale: isDragging ? 1.3 : 1,
                }}
              />
            </div>

            {/* Labels */}
            <div className="flex justify-between px-4">
              <div className="text-steel-500 text-xs font-mono">
                {minLabel || min}
              </div>
              <div className="text-steel-500 text-xs font-mono">
                {maxLabel || max}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Button - fixed at bottom */}
      <div className="px-6 pb-6 safe-bottom">
        <button
          onClick={handleSubmit}
          disabled={!hasInteracted}
          className={`w-full font-bold py-4 px-6 rounded-xl transition-all duration-200 ${
            hasInteracted
              ? 'bg-glitch hover:bg-glitch-bright text-frost shadow-glow active:scale-[0.98]'
              : 'bg-steel-800 text-steel-500 cursor-not-allowed'
          }`}
        >
          Confirm
        </button>
        <p className="text-center text-steel-600 text-xs font-mono mt-3">
          Drag the slider to adjust your rating
        </p>
      </div>
    </div>
  );
}
