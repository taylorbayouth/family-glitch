'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TextAreaParams } from '@/lib/types/template-params';

/**
 * The Open Field (tpl_text_area)
 *
 * Purpose: Deep, specific questions (e.g., "What is Dad's 'tell' when he's lying?")
 *
 * Features:
 * - Large minimalist text area
 * - Character count indicator
 * - Submit button appears after typing starts
 */
export function TextAreaTemplate({
  prompt,
  subtitle,
  placeholder = 'Type your answer...',
  maxLength = 500,
  minLength = 1,
  onSubmit,
}: TextAreaParams) {
  const [value, setValue] = useState('');
  const characterCount = value.length;
  const hasContent = value.trim().length >= minLength;

  const handleSubmit = () => {
    if (hasContent) {
      onSubmit({ text: value.trim() });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && hasContent) {
      handleSubmit();
    }
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-1 pb-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto space-y-4"
      >
        {/* Prompt */}
        <div className="text-center space-y-1">
          <h2 className="text-xl md:text-2xl font-black text-frost">
            {prompt}
          </h2>
          {subtitle && (
            <p className="text-steel-400 text-sm font-mono">
              {subtitle}
            </p>
          )}
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, maxLength))}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full h-40 px-4 py-3 bg-void-light border border-steel-800 rounded-xl text-frost placeholder:text-steel-600 focus:outline-none focus:border-glitch transition-colors resize-none font-sans text-base"
            autoFocus
          />

          {/* Character Count */}
          <div className="absolute bottom-3 right-3 font-mono text-xs text-steel-500">
            <span className={characterCount >= maxLength ? 'text-alert' : ''}>
              {characterCount}
            </span>
            /{maxLength}
          </div>
        </div>

        {/* Submit Button - Always visible, disabled when empty */}
        <button
          onClick={handleSubmit}
          disabled={!hasContent}
          className={`w-full font-bold py-3 px-6 rounded-xl transition-all duration-200 ${
            hasContent
              ? 'bg-glitch hover:bg-glitch-bright text-frost shadow-glow hover:shadow-glow-strong active:scale-[0.98] cursor-pointer'
              : 'bg-steel-800 text-steel-500 cursor-not-allowed'
          }`}
        >
          Submit
        </button>

        {/* Hint */}
        <p className="text-center text-steel-600 text-xs font-mono">
          Press ⌘+Enter to submit
        </p>
      </motion.div>
    </div>
  );
}
