'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TextAreaParams } from '@/lib/types/template-params';

/**
 * The Open Field (tpl_text_area)
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
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && hasContent) {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-dvh bg-void flex flex-col safe-y">
      {/* Content - centered */}
      <div className="flex-1 flex items-center justify-center px-6 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl space-y-4"
        >
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-frost">{prompt}</h2>
            {subtitle && (
              <p className="text-steel-400 text-sm md:text-base font-mono">{subtitle}</p>
            )}
          </div>

          <div className="relative">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value.slice(0, maxLength))}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full h-48 px-6 py-4 bg-void-light border border-steel-800 rounded-xl text-frost placeholder:text-steel-600 focus:outline-none focus:border-glitch transition-colors resize-none font-sans"
              autoFocus
            />
            <div className="absolute bottom-4 right-4 font-mono text-xs text-steel-500">
              <span className={characterCount >= maxLength ? 'text-alert' : ''}>
                {characterCount}
              </span>
              /{maxLength}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Button - fixed at bottom */}
      <div className="px-6 pb-6 safe-bottom">
        <button
          onClick={handleSubmit}
          disabled={!hasContent}
          className={`w-full font-bold py-4 px-6 rounded-xl transition-all duration-200 ${
            hasContent
              ? 'bg-glitch hover:bg-glitch-bright text-frost shadow-glow active:scale-[0.98]'
              : 'bg-steel-800 text-steel-500 cursor-not-allowed'
          }`}
        >
          Submit
        </button>
        <p className="text-center text-steel-600 text-xs font-mono mt-3">
          Press ⌘+Enter to submit
        </p>
      </div>
    </div>
  );
}
