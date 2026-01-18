'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Challenge } from '@/types/game';

interface PlayPhaseProps {
  title: string;
  message: string;
  subtext?: string;
  challenge?: Challenge;
  onSubmit: (value: string, type: string) => void;
}

export function PlayPhase({
  title,
  message,
  subtext,
  challenge,
  onSubmit,
}: PlayPhaseProps) {
  const [inputValue, setInputValue] = useState('');
  const [bidValue, setBidValue] = useState(3);
  const [ratingValue, setRatingValue] = useState(0);

  const handleSubmit = () => {
    if (!challenge) return;

    switch (challenge.type) {
      case 'input':
        if (inputValue.trim()) {
          onSubmit(inputValue.trim(), 'input');
        }
        break;
      case 'bid':
        onSubmit(bidValue.toString(), 'bid');
        break;
      case 'rating':
        if (ratingValue > 0) {
          onSubmit(ratingValue.toString(), 'rating');
        }
        break;
      case 'choice':
        // Handled by button clicks
        break;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black text-white flex flex-col p-6"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <motion.h2
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-cyan-400 text-sm uppercase tracking-widest mb-2"
        >
          {challenge?.context || 'The Glitch Speaks'}
        </motion.h2>
        <motion.h1
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bold glitch-text"
        >
          {title}
        </motion.h1>
      </div>

      {/* Main Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 flex flex-col items-center justify-center"
      >
        <p className="text-xl text-center leading-relaxed max-w-sm mb-4">
          {message}
        </p>
        {subtext && (
          <p className="text-gray-500 text-sm text-center">{subtext}</p>
        )}

        {/* Challenge Input */}
        {challenge && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-sm mt-8"
          >
            {challenge.type === 'input' && (
              <>
                <p className="text-lg text-center mb-4">{challenge.prompt}</p>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Your answer..."
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-lg text-center focus:border-cyan-500 focus:outline-none"
                />
              </>
            )}

            {challenge.type === 'choice' && challenge.options && (
              <>
                <p className="text-lg text-center mb-4">{challenge.prompt}</p>
                <div className="space-y-3">
                  {challenge.options.map((option, i) => (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onSubmit(option, 'choice')}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-lg hover:border-cyan-500 transition-colors"
                    >
                      {option}
                    </motion.button>
                  ))}
                </div>
              </>
            )}

            {challenge.type === 'bid' && (
              <>
                <p className="text-lg text-center mb-4">{challenge.prompt}</p>
                <div className="flex items-center justify-center space-x-4 mb-4">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <motion.button
                      key={num}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setBidValue(num)}
                      className={`w-12 h-12 rounded-full text-xl font-bold ${
                        bidValue === num
                          ? 'bg-cyan-500 text-black'
                          : 'bg-gray-800 text-white'
                      }`}
                    >
                      {num}
                    </motion.button>
                  ))}
                </div>
                <p className="text-gray-400 text-center text-sm">
                  Higher bid = Higher risk & reward
                </p>
              </>
            )}

            {challenge.type === 'rating' && (
              <>
                <p className="text-lg text-center mb-4">{challenge.prompt}</p>
                <div className="flex items-center justify-center space-x-2 mb-4">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <motion.button
                      key={num}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setRatingValue(num)}
                      className="text-4xl"
                    >
                      {num <= ratingValue ? '⭐' : '☆'}
                    </motion.button>
                  ))}
                </div>
                <p className="text-gray-400 text-center text-sm">
                  How accurate was that?
                </p>
              </>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Submit Button (for non-choice types) */}
      {challenge && challenge.type !== 'choice' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={
            (challenge.type === 'input' && !inputValue.trim()) ||
            (challenge.type === 'rating' && ratingValue === 0)
          }
          className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-4 rounded-lg text-xl disabled:opacity-50"
        >
          SUBMIT
        </motion.button>
      )}
    </motion.div>
  );
}
