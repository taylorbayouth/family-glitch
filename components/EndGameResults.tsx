'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { usePlayerStore } from '@/lib/store/player-store';
import { useGameStore } from '@/lib/store/game-store';
import type { AnnouncerResult, PlayerResult } from '@/lib/types/announcer';

interface EndGameResultsProps {
  /** Called when user wants to play again */
  onPlayAgain: () => void;
}

type Phase = 'loading' | 'intro' | 'countdown' | 'revealing' | 'complete';

const REVEAL_DELAY_MS = 4000; // 4 seconds between reveals
const COUNTDOWN_DURATION = 3; // 3 second countdown

/**
 * EndGameResults Component
 *
 * Handles the animated end-game reveal sequence:
 * 1. Loading - Fetch AI commentary
 * 2. Intro - "And now... the final results!"
 * 3. Countdown - 3... 2... 1...
 * 4. Revealing - Players revealed last to first with countdown between
 * 5. Complete - All revealed, show play again button
 */
export function EndGameResults({ onPlayAgain }: EndGameResultsProps) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [results, setResults] = useState<AnnouncerResult | null>(null);
  const [revealedIndex, setRevealedIndex] = useState(-1);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const [nextRevealCountdown, setNextRevealCountdown] = useState(REVEAL_DELAY_MS / 1000);
  const [error, setError] = useState<string | null>(null);

  const players = usePlayerStore((state) => state.players);
  const scores = useGameStore((state) => state.scores);
  const turns = useGameStore((state) => state.turns);
  const settings = useGameStore((state) => state.settings);

  // Get rankings in reveal order (last place first)
  const rankingsToReveal = results?.rankings
    ? [...results.rankings].sort((a, b) => b.rank - a.rank)
    : [];

  // Fetch results from announcer API
  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setPhase('loading');
    setError(null);

    try {
      const response = await fetch('/api/announcer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameData: {
            players,
            scores,
            turns,
            settings,
          },
        }),
      });

      const data = await response.json();

      if (!data.success || !data.result) {
        throw new Error(data.error || 'Failed to get results');
      }

      setResults(data.result);

      // Start intro phase after short delay
      setTimeout(() => setPhase('intro'), 500);
    } catch (err) {
      console.error('Failed to fetch announcer results:', err);
      setError(err instanceof Error ? err.message : 'Failed to load results');
    }
  };

  // Handle intro -> countdown transition
  useEffect(() => {
    if (phase === 'intro') {
      const timer = setTimeout(() => setPhase('countdown'), 2000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Handle countdown
  useEffect(() => {
    if (phase === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setPhase('revealing');
        setRevealedIndex(0);
      }
    }
  }, [phase, countdown]);

  // Handle reveal progression
  useEffect(() => {
    if (phase === 'revealing' && revealedIndex >= 0) {
      const isLastReveal = revealedIndex === rankingsToReveal.length - 1;

      if (isLastReveal) {
        // Winner revealed - trigger confetti and complete
        triggerConfetti();
        setTimeout(() => setPhase('complete'), 1000);
      } else {
        // Start countdown to next reveal
        setNextRevealCountdown(REVEAL_DELAY_MS / 1000);
      }
    }
  }, [phase, revealedIndex, rankingsToReveal.length]);

  // Handle between-reveal countdown
  useEffect(() => {
    if (phase === 'revealing' && nextRevealCountdown > 0 && revealedIndex < rankingsToReveal.length - 1) {
      const timer = setTimeout(() => {
        setNextRevealCountdown((c) => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'revealing' && nextRevealCountdown === 0 && revealedIndex < rankingsToReveal.length - 1) {
      // Reveal next player
      setRevealedIndex((i) => i + 1);
      setNextRevealCountdown(REVEAL_DELAY_MS / 1000);
    }
  }, [phase, nextRevealCountdown, revealedIndex, rankingsToReveal.length]);

  const triggerConfetti = useCallback(() => {
    // Dynamic import to avoid SSR issues
    import('canvas-confetti').then((confetti) => {
      // First burst
      confetti.default({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Second burst after delay
      setTimeout(() => {
        confetti.default({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
      }, 250);

      setTimeout(() => {
        confetti.default({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 400);
    }).catch(() => {
      // Confetti not available, that's ok
    });
  }, []);

  const getPlayerAvatar = (playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    return player?.avatar || 1;
  };

  const getRankSuffix = (rank: number) => {
    if (rank === 1) return 'st';
    if (rank === 2) return 'nd';
    if (rank === 3) return 'rd';
    return 'th';
  };

  // Loading state
  if (phase === 'loading') {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6 safe-y">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="flex justify-center gap-2 mb-6">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-4 h-4 rounded-full bg-glitch"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
          <p className="text-steel-400 font-medium">Analyzing game results...</p>
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-alert mt-4"
            >
              {error}
            </motion.p>
          )}
        </motion.div>
      </div>
    );
  }

  // Intro phase
  if (phase === 'intro') {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6 safe-y">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="text-center"
        >
          <motion.h1
            className="text-4xl md:text-6xl font-black text-frost"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
          >
            And now...
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-2xl md:text-3xl text-glitch font-bold mt-4"
          >
            THE FINAL RESULTS
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Countdown phase
  if (phase === 'countdown') {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6 safe-y">
        <AnimatePresence mode="wait">
          <motion.div
            key={countdown}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="text-8xl md:text-9xl font-black text-glitch"
          >
            {countdown}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Revealing phase and Complete phase
  return (
    <div className="min-h-dvh p-6 pb-32 safe-y">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-black text-frost">
            FINAL RESULTS
          </h1>
          {results?.gameSummary && phase === 'complete' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-steel-400 mt-2"
            >
              {results.gameSummary}
            </motion.p>
          )}
        </motion.div>

        {/* Revealed Players */}
        <div className="space-y-4">
          <AnimatePresence>
            {rankingsToReveal.slice(0, revealedIndex + 1).map((player, index) => {
              const isWinner = player.rank === 1;
              const isLatestReveal = index === revealedIndex;

              return (
                <motion.div
                  key={player.playerId}
                  initial={{ opacity: 0, x: 100, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 24,
                  }}
                  className={`
                    glass rounded-2xl p-6 border-2
                    ${isWinner
                      ? 'border-amber-400 bg-amber-400/10 shadow-glow-strong'
                      : 'border-void-700'
                    }
                    ${isLatestReveal && !isWinner ? 'ring-2 ring-glitch' : ''}
                  `}
                >
                  {/* Winner Badge */}
                  {isWinner && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.2 }}
                      className="text-center mb-4"
                    >
                      <span className="text-4xl">🏆</span>
                      <p className="text-amber-400 font-black text-xl">WINNER</p>
                    </motion.div>
                  )}

                  {/* Rank & Player Info */}
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className={`
                        text-center min-w-[60px]
                        ${isWinner ? 'text-amber-400' : 'text-steel-500'}
                      `}
                    >
                      <span className="text-3xl font-black">{player.rank}</span>
                      <span className="text-lg font-bold">{getRankSuffix(player.rank)}</span>
                    </motion.div>

                    {/* Avatar */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.15 }}
                      className={`
                        relative w-16 h-16 rounded-full overflow-hidden
                        ring-4 ${isWinner ? 'ring-amber-400' : 'ring-void-600'}
                      `}
                    >
                      <Image
                        src={`/avatars/${getPlayerAvatar(player.playerId)}.png`}
                        alt={player.playerName}
                        fill
                        className="object-cover"
                      />
                    </motion.div>

                    {/* Name & Score */}
                    <div className="flex-1">
                      <motion.h3
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className={`
                          text-xl font-black
                          ${isWinner ? 'text-amber-400' : 'text-frost'}
                        `}
                      >
                        {player.playerName}
                      </motion.h3>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.25 }}
                        className="text-2xl font-bold text-glitch"
                      >
                        {player.finalScore} points
                      </motion.p>
                    </div>
                  </div>

                  {/* Title */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-4"
                  >
                    <p className={`
                      text-lg font-bold italic
                      ${isWinner ? 'text-amber-300' : 'text-mint'}
                    `}>
                      &quot;{player.title}&quot;
                    </p>
                  </motion.div>

                  {/* Blurb */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-3 text-steel-300 leading-relaxed"
                  >
                    {player.blurb}
                  </motion.p>

                  {/* Highlight Moment (if available) */}
                  {player.highlightMoment && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="mt-4 p-3 rounded-lg bg-void-800/50 border border-void-700"
                    >
                      <p className="text-xs text-steel-500 uppercase font-bold mb-1">
                        Highlight Moment
                      </p>
                      <p className="text-steel-300 text-sm">
                        {player.highlightMoment}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Next Reveal Countdown */}
        {phase === 'revealing' && revealedIndex < rankingsToReveal.length - 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center"
          >
            <p className="text-steel-500 text-sm mb-2">Next reveal in...</p>
            <div className="w-full max-w-xs mx-auto h-2 bg-void-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-glitch"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: REVEAL_DELAY_MS / 1000, ease: 'linear' }}
                key={revealedIndex}
              />
            </div>
            <p className="text-2xl font-bold text-glitch mt-2">
              {nextRevealCountdown}s
            </p>
          </motion.div>
        )}

        {/* Play Again Button */}
        {phase === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <button
              onClick={onPlayAgain}
              className="
                px-8 py-4 rounded-xl
                bg-glitch hover:bg-glitch-bright
                text-void font-bold text-lg
                transition-colors
                shadow-glow hover:shadow-glow-strong
              "
            >
              Play Again
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
