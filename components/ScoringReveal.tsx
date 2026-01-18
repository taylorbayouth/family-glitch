/**
 * ============================================================================
 * SCORING REVEAL - Dramatic Score Presentation
 * ============================================================================
 *
 * This component handles the exciting reveal of scores after a cartridge.
 * It supports multiple reveal modes:
 * - Sequential: One player at a time with suspense
 * - All-at-once: Show everyone simultaneously
 * - Leaderboard: Rank order with animations
 *
 * Features:
 * - LLM explanation for each score
 * - Animated reveals with suspense
 * - Celebration effects for top scorers
 * - Overall commentary from LLM
 *
 * Design:
 * - Full viewport (public viewing mode - phone on table)
 * - Large text for readability
 * - Dramatic timing and animations
 */

'use client';

import { useState, useEffect } from 'react';
import { Player } from '@/types/game';
import { ScoringRevealData } from '@/types/cartridge';

/**
 * Props for ScoringReveal component
 */
interface ScoringRevealProps {
  /** Reveal data */
  data: ScoringRevealData;

  /** All players (for looking up names/avatars) */
  players: Player[];

  /** Callback when reveal is complete */
  onComplete: () => void;

  /** Allow skip? */
  allowSkip?: boolean;
}

/**
 * ScoringReveal Component
 *
 * Handles dramatic presentation of scores with LLM explanations
 */
export function ScoringReveal({
  data,
  players,
  onComplete,
  allowSkip = false,
}: ScoringRevealProps) {
  // ===========================================================================
  // STATE
  // ===========================================================================

  const [currentRevealIndex, setCurrentRevealIndex] = useState(0);
  const [showingSummary, setShowingSummary] = useState(false);
  const [celebrationActive, setCelebrationActive] = useState(false);

  const isSequential = data.mode === 'sequential';
  const currentReveal = data.reveals[currentRevealIndex];
  const isLastReveal = currentRevealIndex === data.reveals.length - 1;

  // ===========================================================================
  // AUTO-ADVANCE (Sequential mode)
  // ===========================================================================

  useEffect(() => {
    if (!isSequential || showingSummary) return;

    const delay = currentReveal?.suspenseDelay || 3000;

    const timeout = setTimeout(() => {
      if (isLastReveal) {
        // Show summary or complete
        if (data.summary) {
          setShowingSummary(true);
        } else {
          handleComplete();
        }
      } else {
        setCurrentRevealIndex((i) => i + 1);
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [currentRevealIndex, isSequential, showingSummary, data.summary, isLastReveal]);

  // ===========================================================================
  // CELEBRATION EFFECTS
  // ===========================================================================

  useEffect(() => {
    // Trigger celebration for top scorer
    if (isLastReveal && data.celebration) {
      setTimeout(() => {
        setCelebrationActive(true);

        // Auto-dismiss celebration
        setTimeout(() => {
          setCelebrationActive(false);
        }, 3000);
      }, 1000);
    }
  }, [isLastReveal, data.celebration]);

  // ===========================================================================
  // HANDLERS
  // ===========================================================================

  const handleNext = () => {
    if (showingSummary) {
      handleComplete();
    } else if (isLastReveal) {
      if (data.summary) {
        setShowingSummary(true);
      } else {
        handleComplete();
      }
    } else {
      setCurrentRevealIndex((i) => i + 1);
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  // ===========================================================================
  // RENDER HELPERS
  // ===========================================================================

  const getPlayerById = (id: string) => {
    return players.find((p) => p.id === id);
  };

  // ===========================================================================
  // RENDER - SUMMARY
  // ===========================================================================

  if (showingSummary && data.summary) {
    return (
      <div className="viewport-container bg-gradient-to-br from-primary-500 to-secondary-500">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="card max-w-2xl text-center bg-white/95 backdrop-blur-sm">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-3xl font-bold mb-4">What a Round!</h1>
            <p className="text-xl text-neutral-700 leading-relaxed">
              {data.summary}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 safe-area-bottom">
          <button onClick={handleComplete} className="btn-primary w-full text-lg">
            Continue
          </button>
        </div>

        {/* Celebration overlay */}
        {celebrationActive && <CelebrationOverlay type={data.celebration} />}
      </div>
    );
  }

  // ===========================================================================
  // RENDER - SEQUENTIAL MODE
  // ===========================================================================

  if (isSequential) {
    const player = getPlayerById(currentReveal.playerId);

    if (!player) {
      return (
        <div className="viewport-container flex-center bg-danger-50">
          <div className="card text-center">
            <h1 className="text-xl font-bold text-danger-600">Error</h1>
            <p className="text-neutral-600">Player not found</p>
          </div>
        </div>
      );
    }

    return (
      <div className="viewport-container bg-gradient-to-br from-success-50 to-primary-50">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-800">{data.title}</h2>
            <div className="text-sm text-neutral-500">
              {currentRevealIndex + 1} / {data.reveals.length}
            </div>
          </div>
          {data.subtitle && (
            <p className="text-sm text-neutral-600 mt-1">{data.subtitle}</p>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div
            className={`card max-w-2xl w-full text-center animate-${currentReveal.animation || 'slide-up'}`}
          >
            {/* Player info */}
            <div className="mb-6">
              <div className="text-6xl mb-3">{player.avatarId}</div>
              <h2 className="text-3xl font-bold mb-2">{player.name}</h2>
            </div>

            {/* Answer */}
            <div className="mb-6">
              <p className="text-sm text-neutral-500 uppercase tracking-wide mb-2">
                Their Answer
              </p>
              <p className="text-xl text-neutral-800 font-medium leading-relaxed">
                "{currentReveal.answer}"
              </p>
            </div>

            {/* Score */}
            <div className="mb-6">
              <div className="inline-block bg-gradient-to-br from-primary-500 to-secondary-500 text-white rounded-2xl px-8 py-4">
                <div className="text-5xl font-bold">
                  +{currentReveal.points}
                  {currentReveal.bonus && (
                    <span className="text-3xl ml-2">🌟 +{currentReveal.bonus}</span>
                  )}
                </div>
                <div className="text-sm uppercase tracking-wider mt-1">Points</div>
              </div>
            </div>

            {/* LLM Explanation */}
            <div className="bg-neutral-50 rounded-lg p-4">
              <p className="text-sm text-neutral-500 uppercase tracking-wide mb-2">
                Why This Score?
              </p>
              <p className="text-base text-neutral-700 leading-relaxed">
                {currentReveal.explanation}
              </p>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="px-6 py-4 bg-white border-t border-neutral-200">
          <div className="flex gap-3">
            {allowSkip && !isLastReveal && (
              <button onClick={handleComplete} className="btn-ghost flex-1">
                Skip All
              </button>
            )}
            <button onClick={handleNext} className="btn-primary flex-1 text-lg">
              {isLastReveal
                ? data.summary
                  ? 'See Summary'
                  : 'Continue'
                : 'Next Player'}
            </button>
          </div>
        </div>

        {/* Celebration overlay */}
        {celebrationActive && <CelebrationOverlay type={data.celebration} />}
      </div>
    );
  }

  // ===========================================================================
  // RENDER - ALL-AT-ONCE MODE
  // ===========================================================================

  if (data.mode === 'all-at-once') {
    return (
      <div className="viewport-container bg-gradient-to-br from-primary-50 to-secondary-50">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-800">{data.title}</h2>
          {data.subtitle && (
            <p className="text-sm text-neutral-600 mt-1">{data.subtitle}</p>
          )}
        </div>

        {/* Scrollable results */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {data.reveals.map((reveal, index) => {
              const player = getPlayerById(reveal.playerId);
              if (!player) return null;

              return (
                <div
                  key={reveal.playerId}
                  className="card animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-4">
                    {/* Player */}
                    <div className="flex-shrink-0 text-center">
                      <div className="text-4xl mb-1">{player.avatarId}</div>
                      <p className="text-sm font-semibold text-neutral-700">
                        {player.name}
                      </p>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-base text-neutral-800 mb-2">
                        "{reveal.answer}"
                      </p>
                      <p className="text-sm text-neutral-600 mb-3">
                        {reveal.explanation}
                      </p>
                      <div className="inline-block bg-primary-500 text-white px-4 py-2 rounded-lg font-bold">
                        +{reveal.points}
                        {reveal.bonus && <span className="ml-2">🌟 +{reveal.bonus}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action bar */}
        <div className="px-6 py-4 bg-white border-t border-neutral-200">
          <button onClick={handleComplete} className="btn-primary w-full text-lg">
            Continue
          </button>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // RENDER - LEADERBOARD MODE
  // ===========================================================================

  if (data.mode === 'leaderboard') {
    // Sort by points
    const sorted = [...data.reveals].sort((a, b) => {
      const aTotal = a.points + (a.bonus || 0);
      const bTotal = b.points + (b.bonus || 0);
      return bTotal - aTotal;
    });

    return (
      <div className="viewport-container bg-gradient-to-br from-warning-50 to-primary-50">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-800">{data.title}</h2>
          {data.subtitle && (
            <p className="text-sm text-neutral-600 mt-1">{data.subtitle}</p>
          )}
        </div>

        {/* Leaderboard */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-3">
            {sorted.map((reveal, index) => {
              const player = getPlayerById(reveal.playerId);
              if (!player) return null;

              const total = reveal.points + (reveal.bonus || 0);
              const rank = index + 1;
              const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';

              return (
                <div
                  key={reveal.playerId}
                  className="card animate-slide-up"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex-shrink-0 text-center w-12">
                      {rankEmoji || (
                        <div className="text-2xl font-bold text-neutral-400">
                          #{rank}
                        </div>
                      )}
                    </div>

                    {/* Player */}
                    <div className="flex-shrink-0">
                      <div className="text-3xl">{player.avatarId}</div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-neutral-800">
                        {player.name}
                      </h3>
                      <p className="text-sm text-neutral-600 truncate-1">
                        {reveal.explanation}
                      </p>
                    </div>

                    {/* Score */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-2xl font-bold text-primary-600">
                        +{total}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action bar */}
        <div className="px-6 py-4 bg-white border-t border-neutral-200">
          <button onClick={handleComplete} className="btn-primary w-full text-lg">
            Continue
          </button>
        </div>

        {/* Celebration overlay */}
        {celebrationActive && <CelebrationOverlay type={data.celebration} />}
      </div>
    );
  }

  return null;
}

/**
 * Celebration overlay component
 */
function CelebrationOverlay({
  type,
}: {
  type?: 'confetti' | 'sparkles' | 'fireworks';
}) {
  if (!type) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="text-9xl animate-pulse-glow">
        {type === 'confetti' && '🎊'}
        {type === 'sparkles' && '✨'}
        {type === 'fireworks' && '🎆'}
      </div>
    </div>
  );
}
