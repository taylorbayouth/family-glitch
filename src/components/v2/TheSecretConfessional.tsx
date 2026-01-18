'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ConfessionalData } from '@/types/game-v2';
import { ProgressBar } from './ProgressBar';

interface TheSecretConfessionalProps {
  data: ConfessionalData;
  onSubmit: (value: string) => void;
}

export function TheSecretConfessional({
  data,
  onSubmit,
}: TheSecretConfessionalProps) {
  const [value, setValue] = useState('');
  const [isVaulting, setIsVaulting] = useState(false);

  const handleSubmit = () => {
    if (
      value.trim().length >= (data.min_length || 1) &&
      (!data.max_length || value.trim().length <= data.max_length)
    ) {
      setIsVaulting(true);
      // Animation plays, then submit
      setTimeout(() => {
        onSubmit(value.trim());
      }, 1200); // Match animation duration
    }
  };

  const isValid =
    value.trim().length >= (data.min_length || 1) &&
    (!data.max_length || value.trim().length <= data.max_length);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen bg-black text-white flex flex-col p-6 relative overflow-hidden"
    >
      <ProgressBar />

      {/* Background spotlight effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 1 }}
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(0,255,255,0.2) 0%, transparent 70%)',
          }}
        />
      </motion.div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="text-cyan-400 text-sm uppercase tracking-widest mb-2">
            🔒 The Secret Confessional 🔒
          </div>
          <h2 className="text-2xl font-bold leading-relaxed max-w-md mx-auto">
            {data.question}
          </h2>
          {data.helper_text && (
            <p className="text-gray-500 text-sm mt-2">{data.helper_text}</p>
          )}
        </motion.div>

        {/* The Input Box with Spotlight */}
        <AnimatePresence mode="wait">
          {!isVaulting ? (
            <motion.div
              key="input"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, y: 100, opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="w-full max-w-md"
            >
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={data.placeholder || 'Type your answer...'}
                rows={4}
                autoFocus
                className="w-full bg-gray-900/50 border-2 border-cyan-500/30 focus:border-cyan-500 rounded-lg px-4 py-3 text-white text-lg resize-none focus:outline-none transition-colors shadow-lg shadow-cyan-500/10"
                style={{
                  boxShadow: isValid
                    ? '0 0 30px rgba(0, 255, 255, 0.3)'
                    : undefined,
                }}
              />

              {/* Character count */}
              {data.min_length && (
                <div className="text-right text-sm mt-2 text-gray-500">
                  {value.length} / {data.min_length} minimum
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="vaulting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: [1, 0.8, 1.2, 0] }}
                transition={{ duration: 1.2 }}
                className="text-6xl mb-4"
              >
                🔐
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.2 }}
                className="text-cyan-400 text-xl"
              >
                Vaulting your secret...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Submit Button */}
      {!isVaulting && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={!isValid}
          className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-4 rounded-lg text-xl disabled:opacity-30 disabled:grayscale relative overflow-hidden"
        >
          <motion.div
            animate={
              isValid
                ? {
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }
                : {}
            }
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 opacity-50"
            style={{ backgroundSize: '200% 100%' }}
          />
          <span className="relative z-10">VAULT IT</span>
        </motion.button>
      )}
    </motion.div>
  );
}
