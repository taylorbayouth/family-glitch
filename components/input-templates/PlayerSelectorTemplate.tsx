'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PlayerSelectorParams } from '@/lib/types/template-params';

/**
 * The Lineup (tpl_player_selector)
 *
 * Purpose: Voting, accusing, or selecting a target (e.g., "Who is the worst driver?")
 *
 * Features:
 * - Grid of other players' avatars (current player hidden)
 * - Single or multiple selection
 * - Confirm button to lock in vote
 */
export function PlayerSelectorTemplate({
  prompt,
  subtitle,
  players,
  currentPlayerId,
  allowMultiple = false,
  maxSelections = 1,
  instructions,
  onSubmit,
}: PlayerSelectorParams) {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  // Filter out current player
  const selectablePlayers = players.filter((p) => p.id !== currentPlayerId);

  // Avatar emojis mapping
  const AVATARS = [
    '👨',
    '👩',
    '👦',
    '👧',
    '🧔',
    '👴',
    '👵',
    '👱‍♂️',
    '👱‍♀️',
    '🧑',
    '👨‍🦰',
    '👩‍🦰',
    '👨‍🦱',
    '👩‍🦱',
    '👨‍🦲',
    '👩‍🦲',
    '👨‍🦳',
    '👩‍🦳',
    '🧒',
    '👶',
  ];

  const isValid = allowMultiple
    ? selectedPlayerIds.length >= 1 && selectedPlayerIds.length <= maxSelections
    : selectedPlayerIds.length === 1;

  const handlePlayerClick = (playerId: string) => {
    if (allowMultiple) {
      if (selectedPlayerIds.includes(playerId)) {
        // Deselect
        setSelectedPlayerIds(selectedPlayerIds.filter((id) => id !== playerId));
      } else {
        // Select (if not at max)
        if (selectedPlayerIds.length < maxSelections) {
          setSelectedPlayerIds([...selectedPlayerIds, playerId]);
        }
      }
    } else {
      // Single selection
      setSelectedPlayerIds([playerId]);
    }
  };

  const handleSubmit = () => {
    if (isValid) {
      const selectedPlayers = selectablePlayers.filter((p) =>
        selectedPlayerIds.includes(p.id)
      );

      onSubmit({
        selectedPlayerIds,
        selectedPlayers: selectedPlayers.map((p) => ({
          id: p.id,
          name: p.name,
        })),
      });
    }
  };

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-6">
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
            {instructions ||
              (allowMultiple
                ? `Select up to ${maxSelections} player${maxSelections > 1 ? 's' : ''}`
                : 'Select one player')}
          </p>
          {allowMultiple && (
            <p className="text-steel-600 text-xs font-mono mt-1">
              {selectedPlayerIds.length} selected
              {maxSelections > 1 ? ` / ${maxSelections} max` : ''}
            </p>
          )}
        </div>

        {/* Player Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {selectablePlayers.map((player, index) => {
            const isSelected = selectedPlayerIds.includes(player.id);
            const isDisabled =
              !isSelected &&
              !allowMultiple &&
              selectedPlayerIds.length > 0 &&
              !selectedPlayerIds.includes(player.id);
            const isMaxReached =
              allowMultiple &&
              !isSelected &&
              selectedPlayerIds.length >= maxSelections;

            return (
              <motion.button
                key={player.id}
                onClick={() => handlePlayerClick(player.id)}
                disabled={isDisabled || isMaxReached}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative rounded-xl p-6 transition-all duration-200
                  ${
                    isSelected
                      ? 'bg-glitch border-2 border-glitch shadow-glow'
                      : 'bg-void-light border-2 border-steel-800 hover:border-glitch/50'
                  }
                  ${
                    isDisabled || isMaxReached
                      ? 'opacity-30 cursor-not-allowed'
                      : 'cursor-pointer'
                  }
                `}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 w-6 h-6 rounded-full bg-void flex items-center justify-center"
                  >
                    <svg
                      className="w-4 h-4 text-glitch"
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

                {/* Avatar */}
                <div
                  className={`w-20 h-20 mx-auto rounded-full border-2 flex items-center justify-center text-4xl mb-3 ${
                    isSelected
                      ? 'border-void bg-void/20'
                      : 'border-steel-800 bg-void-light'
                  }`}
                >
                  {AVATARS[player.avatar - 1] || '👤'}
                </div>

                {/* Player Name */}
                <div
                  className={`text-center font-bold ${
                    isSelected ? 'text-void' : 'text-frost'
                  }`}
                >
                  {player.name}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Submit Button */}
        {isValid && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleSubmit}
            className="w-full bg-glitch hover:bg-glitch-bright text-frost font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-glow hover:shadow-glow-strong active:scale-[0.98]"
          >
            Confirm Selection
          </motion.button>
        )}

        {/* Hint */}
        <p className="text-center text-steel-600 text-xs font-mono">
          Tap a player to select them
        </p>
      </motion.div>
    </div>
  );
}
