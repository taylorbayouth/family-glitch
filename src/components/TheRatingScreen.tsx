'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RatingScreenData, RatingDimension } from '@/types/game';

interface TheRatingScreenProps {
  data: RatingScreenData;
  onSubmit: (ratings: Record<RatingDimension, number>) => void;
}

const DIMENSION_LABELS: Record<RatingDimension, string> = {
  accuracy: 'Accuracy',
  funniness: 'Funniness',
  cleverness: 'Cleverness',
  overall: 'Overall',
};

const DIMENSION_EMOJIS: Record<RatingDimension, string> = {
  accuracy: '🎯',
  funniness: '😂',
  cleverness: '🧠',
  overall: '⭐',
};

export function TheRatingScreen({ data, onSubmit }: TheRatingScreenProps) {
  const {
    dimensions,
    min_value,
    max_value,
    target_content,
    target_media_url,
    author_name,
    author_avatar,
    prompt,
  } = data;

  // Initialize ratings state with min_value for all dimensions
  const [ratings, setRatings] = useState<Record<RatingDimension, number>>(
    dimensions.reduce(
      (acc, dim) => ({ ...acc, [dim]: min_value }),
      {} as Record<RatingDimension, number>
    )
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingChange = (dimension: RatingDimension, value: number) => {
    setRatings((prev) => ({ ...prev, [dimension]: value }));
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit(ratings);
    }, 500);
  };

  // Calculate average for visual feedback
  const averageRating =
    Object.values(ratings).reduce((sum, val) => sum + val, 0) / dimensions.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">{prompt}</h1>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <span className="text-2xl">{author_avatar}</span>
            <span className="text-lg">{author_name}</span>
          </div>
        </motion.div>

        {/* Content Being Rated */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700"
        >
          {target_media_url && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <img
                src={target_media_url}
                alt="Content to rate"
                className="w-full h-auto"
              />
            </div>
          )}
          <p className="text-xl text-white text-center font-medium">
            "{target_content}"
          </p>
        </motion.div>

        {/* Rating Sliders */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-700 space-y-6"
        >
          {dimensions.map((dimension, index) => (
            <motion.div
              key={dimension}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{DIMENSION_EMOJIS[dimension]}</span>
                  <span className="text-white font-medium">
                    {DIMENSION_LABELS[dimension]}
                  </span>
                </div>
                <motion.span
                  key={ratings[dimension]}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-cyan-400"
                >
                  {ratings[dimension]}
                </motion.span>
              </div>

              {/* Slider */}
              <div className="relative">
                <input
                  type="range"
                  min={min_value}
                  max={max_value}
                  value={ratings[dimension]}
                  onChange={(e) =>
                    handleRatingChange(dimension, parseInt(e.target.value))
                  }
                  className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${
                      ((ratings[dimension] - min_value) / (max_value - min_value)) *
                      100
                    }%, #374151 ${
                      ((ratings[dimension] - min_value) / (max_value - min_value)) *
                      100
                    }%, #374151 100%)`,
                  }}
                />

                {/* Value markers */}
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  {Array.from(
                    { length: max_value - min_value + 1 },
                    (_, i) => min_value + i
                  ).map((val) => (
                    <span key={val}>{val}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Average Rating Display */}
        {dimensions.length > 1 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mb-6"
          >
            <p className="text-gray-400 text-sm mb-1">Average Rating</p>
            <motion.p
              key={averageRating}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-4xl font-bold text-white"
            >
              {averageRating.toFixed(1)}
            </motion.p>
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-xl font-bold rounded-xl shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2"
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                ⚡
              </motion.span>
              Submitting...
            </motion.span>
          ) : (
            'Submit Rating'
          )}
        </motion.button>
      </motion.div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #06b6d4, #8b5cf6);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
          transition: transform 0.1s;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #06b6d4, #8b5cf6);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
          transition: transform 0.1s;
        }

        .slider::-moz-range-thumb:hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
}
