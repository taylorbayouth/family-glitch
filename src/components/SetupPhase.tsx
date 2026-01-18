'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/gameStore';

interface SetupPhaseProps {
  onStart: () => void;
}

export function SetupPhase({ onStart }: SetupPhaseProps) {
  const { gameState, updatePlayerNames, setVibe } = useGameStore();
  const playerNames = Object.keys(gameState.players);

  const [names, setNames] = useState<string[]>(
    playerNames.length > 0 ? playerNames : ['Player 1', 'Player 2', 'Player 3']
  );
  const [vibe, setVibeLocal] = useState(gameState.meta.vibe || '');

  const handleNameChange = (index: number, value: string) => {
    const newNames = [...names];
    newNames[index] = value;
    setNames(newNames);
  };

  const handleStart = () => {
    const validNames = names.filter((n) => n.trim() !== '');
    if (validNames.length < 2) {
      alert('Need at least 2 players!');
      return;
    }
    updatePlayerNames(validNames);
    setVibe(vibe || 'somewhere fun');
    onStart();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-black text-white p-6 flex flex-col"
    >
      <motion.h1
        className="text-4xl font-bold text-center mb-2 glitch-text"
        animate={{
          textShadow: [
            '2px 0 #ff00ff, -2px 0 #00ffff',
            '-2px 0 #ff00ff, 2px 0 #00ffff',
          ],
        }}
        transition={{ duration: 0.3, repeat: Infinity, repeatType: 'reverse' }}
      >
        FAMILY GLITCH
      </motion.h1>
      <p className="text-gray-400 text-center mb-8">A game of chaos & connection</p>

      <div className="flex-1 space-y-6">
        <div>
          <label className="block text-cyan-400 text-sm mb-2 uppercase tracking-wide">
            Players
          </label>
          {names.map((name, i) => (
            <input
              key={i}
              type="text"
              value={name}
              onChange={(e) => handleNameChange(i, e.target.value)}
              placeholder={`Player ${i + 1}`}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 mb-3 text-white text-lg focus:border-cyan-500 focus:outline-none"
            />
          ))}
          {names.length < 5 && (
            <button
              onClick={() => setNames([...names, ''])}
              className="text-gray-500 text-sm"
            >
              + Add player
            </button>
          )}
        </div>

        <div>
          <label className="block text-cyan-400 text-sm mb-2 uppercase tracking-wide">
            Where are you?
          </label>
          <input
            type="text"
            value={vibe}
            onChange={(e) => setVibeLocal(e.target.value)}
            placeholder="e.g., Noisy Italian restaurant"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-lg focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleStart}
        className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold py-4 rounded-lg text-xl mt-8"
      >
        BEGIN THE GLITCH
      </motion.button>
    </motion.div>
  );
}
