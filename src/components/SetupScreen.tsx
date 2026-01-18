'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/gameStore';
import type { FamilyRelationship } from '@/types/game';

interface PlayerSetup {
  name: string;
  age?: number;
  relationship?: FamilyRelationship;
}

export function SetupScreen() {
  const { initializePlayers } = useGameStore();

  const [players, setPlayers] = useState<PlayerSetup[]>([
    { name: '', age: undefined, relationship: undefined },
    { name: '', age: undefined, relationship: undefined },
    { name: '', age: undefined, relationship: undefined },
  ]);
  const [vibe, setVibe] = useState('');

  const handleNameChange = (index: number, value: string) => {
    const newPlayers = [...players];
    newPlayers[index].name = value;
    setPlayers(newPlayers);
  };

  const handleAgeChange = (index: number, value: string) => {
    const newPlayers = [...players];
    newPlayers[index].age = value ? parseInt(value) : undefined;
    setPlayers(newPlayers);
  };

  const handleRelationshipChange = (index: number, value: string) => {
    const newPlayers = [...players];
    newPlayers[index].relationship = value ? (value as FamilyRelationship) : undefined;
    setPlayers(newPlayers);
  };

  const handleAddPlayer = () => {
    if (players.length < 6) {
      setPlayers([...players, { name: '', age: undefined, relationship: undefined }]);
    }
  };

  const handleRemovePlayer = (index: number) => {
    if (players.length > 2) {
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  const handleStart = () => {
    const validPlayers = players.filter((p) => p.name.trim() !== '');

    if (validPlayers.length < 2) {
      alert('Need at least 2 players');
      return;
    }

    initializePlayers(validPlayers, vibe || 'somewhere');
  };

  const validPlayers = players.filter((p) => p.name.trim() !== '');
  const canStart = validPlayers.length >= 2;

  const relationshipOptions: { value: FamilyRelationship; label: string }[] = [
    { value: 'mom', label: 'Mom' },
    { value: 'dad', label: 'Dad' },
    { value: 'son', label: 'Son' },
    { value: 'daughter', label: 'Daughter' },
    { value: 'brother', label: 'Brother' },
    { value: 'sister', label: 'Sister' },
    { value: 'grandma', label: 'Grandma' },
    { value: 'grandpa', label: 'Grandpa' },
    { value: 'aunt', label: 'Aunt' },
    { value: 'uncle', label: 'Uncle' },
    { value: 'cousin', label: 'Cousin' },
    { value: 'friend', label: 'Friend' },
    { value: 'other', label: 'Other' },
  ];

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
          <label className="block text-cyan-400 text-sm mb-4 uppercase tracking-wide">
            Players
          </label>
          {players.map((player, i) => (
            <div key={i} className="mb-4 p-4 bg-gray-900 border border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => handleNameChange(i, e.target.value)}
                  placeholder={`Name`}
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                />
                {players.length > 2 && (
                  <button
                    onClick={() => handleRemovePlayer(i)}
                    className="w-10 h-10 bg-gray-800 border border-gray-700 rounded-lg text-gray-500 hover:text-red-400 hover:border-red-400 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 text-xs mb-1">Age (optional)</label>
                  <input
                    type="number"
                    value={player.age || ''}
                    onChange={(e) => handleAgeChange(i, e.target.value)}
                    placeholder="Age"
                    min="1"
                    max="120"
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 text-xs mb-1">Role (optional)</label>
                  <select
                    value={player.relationship || ''}
                    onChange={(e) => handleRelationshipChange(i, e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">Select...</option>
                    {relationshipOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}

          {players.length < 6 && (
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
        {validPlayers.length} player{validPlayers.length !== 1 ? 's' : ''} ready
      </p>
    </motion.div>
  );
}
