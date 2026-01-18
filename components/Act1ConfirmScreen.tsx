/**
 * ============================================================================
 * ACT 1 CONFIRM SCREEN - Quick Acknowledgment
 * ============================================================================
 *
 * This screen briefly confirms that the answer was received and stored.
 * It then prompts to pass the phone to the next player.
 *
 * Design:
 * - Quick animated "Got it!" message
 * - Shows next player's name
 * - Auto-advance option (or manual tap)
 * - Full viewport, no scroll
 */

'use client';

import { useEffect } from 'react';
import { Player } from '@/types/game';

/**
 * Props for Act1ConfirmScreen
 */
interface Act1ConfirmScreenProps {
  /** Player who just answered */
  currentPlayer: Player;

  /** Next player to go */
  nextPlayer: Player | null;

  /** Callback to continue */
  onContinue: () => void;

  /** Auto-advance delay in ms (0 = manual only) */
  autoAdvanceDelay?: number;
}

/**
 * Act 1 Confirm Screen Component
 */
export function Act1ConfirmScreen({
  currentPlayer,
  nextPlayer,
  onContinue,
  autoAdvanceDelay = 0,
}: Act1ConfirmScreenProps) {
  // ===========================================================================
  // AUTO-ADVANCE
  // ===========================================================================

  useEffect(() => {
    if (autoAdvanceDelay > 0) {
      const timeout = setTimeout(onContinue, autoAdvanceDelay);
      return () => clearTimeout(timeout);
    }
  }, [autoAdvanceDelay, onContinue]);

  // ===========================================================================
  // RENDER
  // ===========================================================================

  return (
    <div className="viewport-container bg-gradient-to-br from-success-500 to-primary-500">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center animate-slide-up">
          {/* Checkmark icon */}
          <div className="text-8xl mb-6 animate-pulse-slow">✓</div>

          {/* Main message */}
          <h1 className="text-4xl font-bold text-white mb-4">Got it!</h1>

          <p className="text-xl text-white/90 mb-8">
            Thanks, {currentPlayer.name}
          </p>

          {/* Pass instruction */}
          {nextPlayer && (
            <div className="card bg-white/95 backdrop-blur-sm max-w-2xl">
              <h2 className="text-2xl font-semibold mb-3 text-neutral-700">Pass to</h2>
              <p className="text-mega text-chunky text-primary-600 mb-4">
                {nextPlayer.name}!
              </p>
              <p className="text-base text-neutral-600">
                {nextPlayer.name}'s turn for a question
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="px-6 py-4 safe-area-bottom">
        <button onClick={onContinue} className="btn-primary w-full text-lg">
          {nextPlayer ? `Pass to ${nextPlayer.name}` : 'Continue'}
        </button>
      </div>
    </div>
  );
}
