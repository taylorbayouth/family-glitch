'use client';

import { useGameStore } from '@/lib/store';

/**
 * Game Progress Bar Component
 *
 * Displays:
 * - All three act labels with current act highlighted
 * - Visual progress bar showing % completion
 * - Round counter (e.g., "Round 5 of 12")
 */
export function GameProgressBar() {
  const getTotalRounds = useGameStore((state) => state.getTotalRounds);
  const getCurrentRound = useGameStore((state) => state.getCurrentRound);
  const getCurrentAct = useGameStore((state) => state.getCurrentAct);
  const getProgressPercentage = useGameStore((state) => state.getProgressPercentage);

  const totalRounds = getTotalRounds();
  const currentRound = getCurrentRound();
  const currentAct = getCurrentAct();
  const progressPercentage = getProgressPercentage();

  // Act definitions with complete Tailwind classes (no dynamic generation)
  const acts = [
    { num: 1, label: 'ACT I', activeClass: 'text-mint bg-mint/20 border-mint/50', gradientClass: 'from-mint to-mint-bright' },
    { num: 2, label: 'ACT II', activeClass: 'text-glitch-bright bg-glitch/20 border-glitch/50', gradientClass: 'from-glitch to-glitch-bright' },
    { num: 3, label: 'ACT III', activeClass: 'text-alert bg-alert/20 border-alert/50', gradientClass: 'from-alert to-red-500' },
  ] as const;

  const currentActInfo = acts.find(a => a.num === currentAct)!;

  return (
    <div className="w-full space-y-3">
      {/* Act Labels - Always show all three */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {acts.map((act, idx) => (
            <div key={act.num} className="flex items-center">
              <span
                className={`text-sm font-mono font-bold uppercase tracking-wider px-2 py-1 rounded transition-all border ${
                  currentAct === act.num
                    ? act.activeClass
                    : currentAct > act.num
                    ? 'text-steel-600 line-through border-transparent'
                    : 'text-steel-600 border-transparent'
                }`}
              >
                {act.label}
              </span>
              {idx < acts.length - 1 && (
                <span className="text-steel-700 mx-1">→</span>
              )}
            </div>
          ))}
        </div>
        <span className="text-sm font-mono text-frost">
          Round <span className="font-bold text-glitch-bright">{currentRound}</span> of {totalRounds}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 bg-void-light rounded-full overflow-hidden border border-steel-800">
        {/* Background sections for each act (matching calculateCurrentAct boundaries) */}
        <div className="absolute inset-0 flex">
          <div className="bg-mint/10" style={{ width: '33%' }} />
          <div className="bg-glitch/10" style={{ width: '33%' }} />
          <div className="bg-alert/10" style={{ width: '34%' }} />
        </div>

        {/* Fill */}
        <div
          className={`relative h-full bg-gradient-to-r transition-all duration-500 ease-out ${currentActInfo.gradientClass}`}
          style={{ width: `${progressPercentage}%` }}
        />

        {/* Act dividers (at 33% and 66% to match calculateCurrentAct) */}
        <div className="absolute top-0 left-[33%] w-0.5 h-full bg-steel-700" />
        <div className="absolute top-0 left-[66%] w-0.5 h-full bg-steel-700" />
      </div>
    </div>
  );
}
