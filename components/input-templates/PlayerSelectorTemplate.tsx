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
 * - Large circular avatar buttons in 2-column grid
 * - Single or multiple selection
 * - Dynamic text scaling to fill space
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
  const playerCount = selectablePlayers.length;

  // Get avatar image path
  const getAvatarPath = (index: number) => `/avatars/${index}.png`;

  const isValid = allowMultiple
    ? selectedPlayerIds.length >= 1 && selectedPlayerIds.length <= maxSelections
    : selectedPlayerIds.length === 1;

  const handlePlayerClick = (playerId: string) => {
    if (allowMultiple) {
      if (selectedPlayerIds.includes(playerId)) {
        setSelectedPlayerIds(selectedPlayerIds.filter((id) => id !== playerId));
      } else {
        if (selectedPlayerIds.length < maxSelections) {
          setSelectedPlayerIds([...selectedPlayerIds, playerId]);
        }
      }
    } else {
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

  // Only allow scroll if more than 4 players (2 rows of 2)
  const needsScroll = playerCount > 4;

  return (
    <div className={`flex-1 flex flex-col ${needsScroll ? 'overflow-y-auto' : 'overflow-hidden'}`}>
      {/* Prompt - scales to fill space */}
      <div className="px-5 pt-1 pb-2 text-center">
        <h2
          className="font-black text-frost leading-tight"
          style={{ fontSize: 'clamp(1.25rem, 5vw, 2rem)' }}
        >
          {prompt}
        </h2>
        {subtitle && (
          <p
            className="text-steel-400 font-mono mt-1"
            style={{ fontSize: 'clamp(0.7rem, 2vw, 0.875rem)' }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Player Grid - 2 columns with 20px gaps */}
      <div className="flex-1 px-5">
        <div
          className="grid grid-cols-2 w-full max-w-md mx-auto"
          style={{ gap: '20px' }}
        >
          {selectablePlayers.map((player, index) => {
            const isSelected = selectedPlayerIds.includes(player.id);
            const isMaxReached =
              allowMultiple &&
              !isSelected &&
              selectedPlayerIds.length >= maxSelections;

            return (
              <motion.button
                key={player.id}
                onClick={() => handlePlayerClick(player.id)}
                disabled={isMaxReached}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  flex flex-col items-center justify-center py-3
                  ${isMaxReached ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {/* Circular Avatar with fat border */}
                <div
                  className={`
                    relative rounded-full p-1 transition-all duration-200
                    ${isSelected
                      ? 'bg-glitch shadow-glow-strong'
                      : 'bg-steel-700'
                    }
                  `}
                  style={{ padding: '4px' }}
                >
                  <div
                    className="rounded-full overflow-hidden bg-void-light"
                    style={{
                      width: 'clamp(70px, 20vw, 100px)',
                      height: 'clamp(70px, 20vw, 100px)',
                    }}
                  >
                    <img
                      src={getAvatarPath(player.avatar)}
                      alt={`${player.name}'s avatar`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Checkmark overlay for selected */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-glitch border-2 border-void flex items-center justify-center"
                    >
                      <svg
                        className="w-4 h-4 text-frost"
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
                </div>

                {/* Player Name */}
                <span
                  className={`mt-2 font-bold text-center transition-colors ${
                    isSelected ? 'text-glitch' : 'text-frost'
                  }`}
                  style={{ fontSize: 'clamp(0.875rem, 3vw, 1.125rem)' }}
                >
                  {player.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Bottom area - button and hint */}
      <div className="px-5 pb-4 pt-2">
        {isValid ? (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleSubmit}
            className="w-full bg-glitch hover:bg-glitch-bright text-frost font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-glow hover:shadow-glow-strong active:scale-[0.98]"
            style={{ fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}
          >
            Confirm Selection
          </motion.button>
        ) : (
          <p
            className="text-center text-steel-500 font-mono"
            style={{ fontSize: 'clamp(0.7rem, 2vw, 0.875rem)' }}
          >
            {instructions ||
              (allowMultiple
                ? `Select up to ${maxSelections} player${maxSelections > 1 ? 's' : ''}`
                : 'Tap a player to select')}
          </p>
        )}
      </div>
    </div>
  );
}
