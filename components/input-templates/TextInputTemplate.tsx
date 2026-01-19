'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TextInputParams } from '@/lib/types/template-params';

/**
 * The List Builder (tpl_text_input)
 *
 * Purpose: Rapid-fire short answers (e.g., "Name 3 things in your pockets")
 *
 * Features:
 * - Stack of single-line input fields (terminal style)
 * - Auto-focuses next field on Enter
 * - 1-5 configurable fields
 */
export function TextInputTemplate({
  prompt,
  subtitle,
  fieldCount,
  fieldLabels,
  fieldPlaceholders,
  maxLength = 100,
  requireAll = true,
  onSubmit,
}: TextInputParams) {
  const [values, setValues] = useState<string[]>(Array(fieldCount).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if form is valid
  const isValid = requireAll
    ? values.every((v) => v.trim().length > 0)
    : values.some((v) => v.trim().length > 0);

  const handleChange = (index: number, value: string) => {
    const newValues = [...values];
    newValues[index] = value.slice(0, maxLength);
    setValues(newValues);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Move to next field or submit if on last field
      if (index < fieldCount - 1) {
        inputRefs.current[index + 1]?.focus();
      } else if (isValid) {
        handleSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (isValid) {
      const responses = values
        .map((v, i) => ({
          field: fieldLabels?.[i] || `Field ${i + 1}`,
          value: v.trim(),
        }))
        .filter((r) => r.value.length > 0);

      onSubmit({ responses });
    }
  };

  // Auto-focus first field on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-6">
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

        {/* Input Fields */}
        <div className="space-y-4">
          {Array.from({ length: fieldCount }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              {/* Field Label */}
              {fieldLabels?.[index] && (
                <label className="block text-xs text-steel-500 uppercase tracking-wider font-mono">
                  {fieldLabels[index]}
                </label>
              )}

              {/* Input Field */}
              <div className="relative">
                <input
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  value={values[index]}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  placeholder={
                    fieldPlaceholders?.[index] ||
                    `${fieldLabels?.[index] || `Item ${index + 1}`}...`
                  }
                  className="w-full px-4 py-4 bg-void-light border-b-2 border-steel-800 text-frost placeholder:text-steel-600 focus:outline-none focus:border-glitch transition-colors font-mono"
                  maxLength={maxLength}
                />

                {/* Field Number Indicator */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-steel-800/50 flex items-center justify-center">
                  <span className="text-xs font-mono text-steel-500">
                    {index + 1}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Submit Button */}
        {isValid && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleSubmit}
            className="w-full bg-glitch hover:bg-glitch-bright text-frost font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-glow hover:shadow-glow-strong active:scale-[0.98]"
          >
            Submit All
          </motion.button>
        )}

        {/* Hint */}
        <p className="text-center text-steel-600 text-xs font-mono">
          Press Enter to move to next field
        </p>
      </motion.div>
    </div>
  );
}
