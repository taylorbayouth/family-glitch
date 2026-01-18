'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/gameStore';

export function SetupScreen() {
  const { initializePlayers } = useGameStore();

  const [names, setNames] = useState<string[]>(['', '', '']);
  const [vibe, setVibe] = useState('');

  const handleNameChange = (index: number, value: string) => {
    const newNames = [...names];
    newNames[index] = value;
    setNames(newNames);
  };

  const handleAddPlayer = () => {
    if (names.length < 6) {
      setNames([...names, '']);
    }
  };

  const handleRemovePlayer = (index: number) => {
    if (names.length > 2) {
      setNames(names.filter((_, i) => i !== index));
    }
  };

  const handleStart = () => {
    const validNames = names.filter((n) => n.trim() !== '');

    if (validNames.length < 2) {
      alert('Need at least 2 players');
      return;
    }

    initializePlayers(validNames, vibe || 'somewhere');
  };

  const validNames = names.filter((n) => n.trim() !== '');
  const canStart = validNames.length >= 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-black text-white p-6 flex flex-col"
    >
      {/* Header */}
      <motion.div
        className="text-center mb-8"
        animate={{
          textShadow: [
            '2px 0 #ff00ff, -2px 0 #00ffff',
            '-2px 0 #ff00ff, 2px 0 #00ffff',
          ],
        }}
        transition={{ duration: 0.3, repeat: Infinity, repeatType: 'reverse' }}
      >
        <h1 className="text-5xl font-bold mb-2 glitch-text">FAMILY GLITCH</h1>
        <p className="text-gray-400">A memory-building game</p>
      </motion.div>

      {/* Player Names */}
      <div className="flex-1 space-y-4 max-w-md mx-auto w-full">
        <div>
          <label className="block text-cyan-400 text-sm mb-2 uppercase tracking-wide">
            Players
          </label>
          {names.map((name, i) => (
            <div key={i} className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(i, e.target.value)}
                placeholder={`Player ${i + 1}`}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-lg focus:border-cyan-500 focus:outline-none"
              />
              {names.length > 2 && (
                <button
                  onClick={() => handleRemovePlayer(i)}
                  className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-lg text-gray-500 hover:text-red-400 hover:border-red-400 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {names.length < 6 && (
            <button
              onClick={handleAddPlayer}
              className="text-gray-500 hover:text-cyan-400 text-sm transition-colors"
            >
              + Add player
            </button>
          )}
        </div>

        {/* Location/Vibe */}
        <div>
          <label className="block text-cyan-400 text-sm mb-2 uppercase tracking-wide">
            Where are you?
          </label>
          <input
            type="text"
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            placeholder="e.g., Kitchen table after dinner"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-lg focus:border-cyan-500 focus:outline-none"
          />
          <p className="text-gray-600 text-sm mt-2">
            Optional - helps personalize the questions
          </p>
        </div>
      </div>

      {/* Start Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleStart}
        disabled={!canStart}
        className="w-full max-w-md mx-auto bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-4 rounded-lg text-xl disabled:opacity-30 disabled:grayscale mt-8 relative overflow-hidden"
      >
        <motion.div
          animate={
            canStart
              ? {
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }
              : {}
          }
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 opacity-50"
          style={{ backgroundSize: '200% 100%' }}
        />
        <span className="relative z-10">BEGIN</span>
      </motion.button>

      <p className="text-center text-gray-600 text-sm mt-4">
        {validNames.length} player{validNames.length !== 1 ? 's' : ''} ready
      </p>
    </motion.div>
  );
}
