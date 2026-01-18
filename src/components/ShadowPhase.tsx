'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface ShadowPhaseProps {
  prompt: string;
  onSubmit: (value: string) => void;
}

export function ShadowPhase({ prompt, onSubmit }: ShadowPhaseProps) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6"
    >
      <motion.div
        animate={{
          scale: [1, 1.02, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="text-red-500 text-2xl font-bold mb-4 uppercase tracking-widest"
      >
        ⚡ QUICK! ⚡
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl text-center mb-8 max-w-sm"
      >
        {prompt}
      </motion.p>

      <motion.input
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type fast..."
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        className="w-full max-w-xs bg-gray-900 border-2 border-red-500 rounded-lg px-4 py-3 text-white text-xl text-center focus:outline-none"
      />

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSubmit}
        disabled={!value.trim()}
        className="mt-6 px-8 py-3 bg-red-500 text-white font-bold rounded-lg text-lg disabled:opacity-50"
      >
        SUBMIT
      </motion.button>

      <p className="text-gray-600 text-sm mt-8">
        Don&apos;t let them see what you typed!
      </p>
    </motion.div>
  );
}
