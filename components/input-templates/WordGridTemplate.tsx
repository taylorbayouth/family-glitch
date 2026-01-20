'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { WordGridParams } from '@/lib/types/template-params';

/**
 * The Vibe Grid (tpl_word_grid)
 *
 * Purpose: Selecting attributes or associations (e.g., "Tap words that describe this restaurant")
 *
 * Features:
 * - Chunky grid of buttons (2x2, 3x3, or 4x4)
 * - Selected buttons invert to solid fill
 * - Configurable selection constraints
 * - Submit disabled until criteria met
 */
export function WordGridTemplate({
  prompt,
  subtitle,
  words,
  gridSize,
  selectionMode,
  minSelections = 1,
  maxSelections,
  instructions,
  onSubmit,
}: WordGridParams) {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);

  // Calculate grid columns based on grid size
  const gridCols = Math.sqrt(gridSize);

  // Determine if selection is valid
  const isValid =
    selectionMode === 'single'
      ? selectedWords.length === 1
      : selectedWords.length >= minSelections &&
        (!maxSelections || selectedWords.length <= maxSelections);

  const handleWordClick = (word: string) => {
    if (selectionMode === 'single') {
      setSelectedWords([word]);
    } else {
      if (selectedWords.includes(word)) {
        // Deselect
        setSelectedWords(selectedWords.filter((w) => w !== word));
      } else {
        // Select (if not at max)
        if (!maxSelections || selectedWords.length < maxSelections) {
          setSelectedWords([...selectedWords, word]);
        }
      }
    }
  };

  const handleSubmit = () => {
    if (isValid) {
      onSubmit({
        selectedWords,
        selectionCount: selectedWords.length,
      });
    }
  };

  const getSelectionText = () => {
    if (selectionMode === 'single') return 'Select 1';
    if (minSelections === maxSelections)
      return `Select exactly ${minSelections}`;
    if (maxSelections) return `Select ${minSelections}-${maxSelections}`;
    return `Select at least ${minSelections}`;
  };

  return (
    <div className="min-h-dvh bg-void flex flex-col safe-y">
      {/* Content - centered */}
      <div className="flex-1 flex items-center justify-center px-6 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl space-y-6"
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

          {/* Instructions */}
          <div className="text-center">
            <p className="text-glitch-bright font-mono text-sm">
              {instructions || getSelectionText()}
            </p>
            <p className="text-steel-600 text-xs font-mono mt-1">
              {selectedWords.length} selected
              {maxSelections ? ` / ${maxSelections} max` : ''}
            </p>
          </div>

          {/* Word Grid */}
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
            }}
          >
            {words.slice(0, gridSize).map((word, index) => {
              const isSelected = selectedWords.includes(word);
              const isDisabled = Boolean(
                !isSelected &&
                maxSelections &&
                selectedWords.length >= maxSelections
              );

              return (
                <motion.button
                  key={index}
                  onClick={() => handleWordClick(word)}
                  disabled={isDisabled}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    aspect-square rounded-xl font-bold text-sm md:text-base
                    transition-all duration-200 relative overflow-hidden
                    ${
                      isSelected
                        ? 'bg-glitch border-2 border-glitch text-void shadow-glow'
                        : 'bg-void-light border-2 border-steel-800 text-frost hover:border-glitch/50'
                    }
                    ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {/* Glow effect for selected */}
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-glitch/20"
                    />
                  )}

                  {/* Word text */}
                  <span className="relative z-10 px-2">{word}</span>

                  {/* Selection indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-5 h-5 rounded-full bg-void flex items-center justify-center"
                    >
                      <svg
                        className="w-3 h-3 text-glitch"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Button - fixed at bottom */}
      <div className="px-6 pb-6 safe-bottom">
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className={`w-full font-bold py-4 px-6 rounded-xl transition-all duration-200 ${
            isValid
              ? 'bg-glitch hover:bg-glitch-bright text-frost shadow-glow active:scale-[0.98]'
              : 'bg-steel-800 text-steel-500 cursor-not-allowed'
          }`}
        >
          Submit Selection
        </button>
      </div>
    </div>
  );
}
