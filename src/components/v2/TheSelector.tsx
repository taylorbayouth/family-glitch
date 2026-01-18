'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { SelectorData } from '@/types/game-v2';

interface TheSelectorProps {
  data: SelectorData;
  onSubmit: (value: string | string[]) => void;
}

export function TheSelector({ data, onSubmit }: TheSelectorProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelect = (option: string) => {
    if (data.allow_multi_select) {
      // Toggle selection for multi-select
      setSelected((prev) =>
        prev.includes(option)
          ? prev.filter((o) => o !== option)
          : [...prev, option]
      );
    } else {
      // Immediate submit for single select
      onSubmit(option);
    }
  };

  const handleSubmit = () => {
    if (selected.length > 0) {
      onSubmit(data.allow_multi_select ? selected : selected[0]);
    }
  };

  const colors = [
    'from-pink-500 to-rose-500',
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-indigo-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-amber-500',
    'from-red-500 to-pink-500',
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black text-white flex flex-col p-6"
    >
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <div className="text-purple-400 text-sm uppercase tracking-widest mb-2">
            🎯 The Selector 🎯
          </div>
          <h2 className="text-3xl font-bold leading-relaxed max-w-lg mx-auto">
            {data.question}
          </h2>
          {data.allow_multi_select && (
            <p className="text-gray-500 text-sm mt-2">
              Select all that apply
            </p>
          )}
        </motion.div>

        {/* Options Grid */}
        <div className="w-full max-w-2xl space-y-4">
          {data.options.map((option, i) => {
            const isSelected = selected.includes(option);
            const colorClass = colors[i % colors.length];

            return (
              <motion.button
                key={i}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02, x: 10 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(option)}
                className={`w-full p-6 rounded-xl text-left font-bold text-xl transition-all relative overflow-hidden ${
                  isSelected
                    ? 'ring-4 ring-white'
                    : 'ring-2 ring-gray-700 hover:ring-gray-500'
                }`}
              >
                {/* Background Gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${colorClass} ${
                    isSelected ? 'opacity-100' : 'opacity-50'
                  } transition-opacity`}
                />

                {/* Animated shine effect on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-20"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />

                {/* Content */}
                <div className="relative z-10 flex items-center justify-between">
                  <span>{option}</span>
                  {data.allow_multi_select && (
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isSelected ? 1 : 0,
                        rotate: isSelected ? 0 : 180,
                      }}
                      className="text-3xl"
                    >
                      ✓
                    </motion.div>
                  )}
                </div>

                {/* Ripple effect on tap */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0.5 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className={`absolute inset-0 bg-gradient-to-r ${colorClass}`}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Submit Button (for multi-select only) */}
      {data.allow_multi_select && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={selected.length === 0}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-lg text-xl disabled:opacity-30 mt-6 relative overflow-hidden"
        >
          <motion.div
            animate={
              selected.length > 0
                ? {
                    scale: [1, 1.2, 1],
                  }
                : {}
            }
            transition={{ duration: 1, repeat: Infinity }}
            className="relative z-10"
          >
            SUBMIT {selected.length > 0 && `(${selected.length})`}
          </motion.div>

          {/* Pulse effect when enabled */}
          {selected.length > 0 && (
            <motion.div
              animate={{
                scale: [1, 1.5],
                opacity: [0.5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              className="absolute inset-0 bg-white rounded-lg"
            />
          )}
        </motion.button>
      )}
    </motion.div>
  );
}
