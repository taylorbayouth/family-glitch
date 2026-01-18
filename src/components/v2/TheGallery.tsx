'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { GalleryData } from '@/types/game-v2';

interface TheGalleryProps {
  data: GalleryData;
  onSubmit?: (value: string) => void;
}

export function TheGallery({ data, onSubmit }: TheGalleryProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = () => {
    if (inputValue.trim() && onSubmit) {
      onSubmit(inputValue.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black text-white flex flex-col p-6 relative"
    >
      {/* CRT Screen Effect Container */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {data.caption && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-6"
          >
            <div className="text-green-400 text-sm uppercase tracking-widest mb-2">
              🖼️ The Gallery 🖼️
            </div>
            <p className="text-xl text-gray-300">{data.caption}</p>
          </motion.div>
        )}

        {/* ASCII Art Display with CRT Effect */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative w-full max-w-2xl"
        >
          {/* CRT Monitor Frame */}
          <div className="bg-gray-900 p-6 rounded-lg border-4 border-gray-700 shadow-2xl relative overflow-hidden">
            {/* Scanlines Effect */}
            <div className="absolute inset-0 pointer-events-none z-10 opacity-10">
              <div
                className="h-full w-full"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, rgba(0,255,0,0.1) 0px, transparent 2px, transparent 4px)',
                }}
              />
            </div>

            {/* Screen Glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(0,255,0,0.1) 0%, transparent 70%)',
              }}
            />

            {/* ASCII Art Content */}
            <motion.pre
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-green-400 font-mono text-xs sm:text-sm leading-tight whitespace-pre overflow-x-auto relative z-20"
              style={{
                textShadow: '0 0 10px rgba(0, 255, 0, 0.7)',
              }}
            >
              {data.art_string}
            </motion.pre>

            {/* Screen Flicker Animation */}
            <motion.div
              animate={{
                opacity: [0, 0.05, 0],
              }}
              transition={{
                duration: 0.1,
                repeat: Infinity,
                repeatDelay: 3,
              }}
              className="absolute inset-0 bg-green-400 pointer-events-none z-30"
            />
          </div>

          {/* CRT Base */}
          <div className="h-6 bg-gray-800 rounded-b-lg border-4 border-t-0 border-gray-700" />
        </motion.div>

        {/* Prompt Text */}
        {data.prompt && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-gray-400 text-center text-lg mt-8 max-w-md"
          >
            {data.prompt}
          </motion.p>
        )}

        {/* Input Box (if needed) */}
        {data.show_input && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="w-full max-w-md mt-8"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="What does this remind you of?"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full bg-gray-900 border-2 border-green-500/30 focus:border-green-500 rounded-lg px-4 py-3 text-white text-lg focus:outline-none transition-colors"
            />
          </motion.div>
        )}
      </div>

      {/* Submit Button */}
      {data.show_input && onSubmit && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={!inputValue.trim()}
          className="w-full bg-gradient-to-r from-green-500 to-cyan-500 text-white font-bold py-4 rounded-lg text-xl disabled:opacity-30 mt-6"
        >
          SUBMIT
        </motion.button>
      )}
    </motion.div>
  );
}
