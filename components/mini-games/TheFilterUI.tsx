'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { sendChatRequest } from '@/lib/ai/client';
import {
  buildFilterGeneratorPrompt,
  buildFilterScorerPrompt,
  parseFilterGeneratorResponse,
  parseFilterScoreResponse,
  toMiniGameResult,
  type FilterGenerateResponse,
} from '@/lib/mini-games/the-filter';
import type { MiniGameResult } from '@/lib/mini-games/types';

interface Player {
  id: string;
  name: string;
  role?: string;
}

interface TheFilterUIProps {
  /** Player answering the challenge */
  targetPlayer: Player;

  /** All players (for context) */
  allPlayers: Player[];

  /** Called when challenge completes */
  onComplete: (result: MiniGameResult) => void;

  /** Called if user wants to skip */
  onSkip?: () => void;
}

type FilterPhase = 'loading' | 'intro' | 'playing' | 'scoring' | 'result';

/**
 * The Filter UI Component
 *
 * Flow:
 * 1. Loading - AI generates rule + 9-12 items
 * 2. Intro - Show the filter challenge
 * 3. Playing - Player selects items that pass the filter
 * 4. Scoring - AI evaluates with fuzzy logic
 * 5. Result - Show score with breakdown
 */
export function TheFilterUI({
  targetPlayer,
  allPlayers,
  onComplete,
  onSkip,
}: TheFilterUIProps) {
  const [phase, setPhase] = useState<FilterPhase>('loading');
  const [rule, setRule] = useState('');
  const [hint, setHint] = useState<string | undefined>();
  const [gridItems, setGridItems] = useState<FilterGenerateResponse['gridItems']>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [result, setResult] = useState<MiniGameResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnId, setTurnId] = useState<string | null>(null);
  const [turnStartTime, setTurnStartTime] = useState<number | null>(null);

  const scores = useGameStore((state) => state.scores);
  const addTurn = useGameStore((state) => state.addTurn);
  const completeTurn = useGameStore((state) => state.completeTurn);
  const updatePlayerScore = useGameStore((state) => state.updatePlayerScore);

  // Generate puzzle on mount
  useEffect(() => {
    generatePuzzle();
  }, []);

  useEffect(() => {
    if (rule && gridItems.length > 0 && !turnId) {
      const createdTurnId = addTurn({
        playerId: targetPlayer.id,
        playerName: targetPlayer.name,
        templateType: 'the_filter',
        prompt: `Select items that match: "${rule}".`,
        templateParams: {
          rule,
          hint,
          gridItems,
        },
      });
      setTurnId(createdTurnId);
      setTurnStartTime(Date.now());
    }
  }, [addTurn, gridItems, hint, rule, targetPlayer.id, targetPlayer.name, turnId]);

  const generatePuzzle = async () => {
    setPhase('loading');
    setError(null);

    try {
      const prompt = buildFilterGeneratorPrompt({
        targetPlayerName: targetPlayer.name,
        allPlayers,
        scores,
      });

      const response = await sendChatRequest([
        { role: 'system', content: prompt },
        { role: 'user', content: 'Generate a Filter puzzle now.' },
      ], {
        toolChoice: 'none',
      });

      const parsed = parseFilterGeneratorResponse(response.text);

      if (!parsed) {
        throw new Error('Invalid puzzle response from AI');
      }

      setRule(parsed.rule);
      setHint(parsed.hint);
      setGridItems(parsed.gridItems);
      setPhase('intro');
    } catch (err) {
      console.error('Failed to generate puzzle:', err);
      // Fallback puzzle
      setRule('Invented before 1900');
      setHint('Think twice about the modern stuff');
      setGridItems([
        { label: 'Bicycle', isCorrect: true, reason: '1817' },
        { label: 'Sliced Bread', isCorrect: false, isTrick: true, reason: '1928' },
        { label: 'Lightbulb', isCorrect: true, reason: '1879' },
        { label: 'Oreo Cookies', isCorrect: false, isTrick: true, reason: '1912' },
        { label: 'Stapler', isCorrect: true, reason: '1866' },
        { label: 'Matches', isCorrect: true, reason: '1826' },
        { label: 'Paperclip', isCorrect: true, reason: '1899 (edge case)' },
        { label: 'Zipper', isCorrect: false, reason: '1913' },
        { label: 'Toilet Paper', isCorrect: true, reason: '1857' },
      ]);
      setPhase('intro');
    }
  };

  const handleItemClick = (itemLabel: string) => {
    if (selectedItems.includes(itemLabel)) {
      setSelectedItems(selectedItems.filter((item) => item !== itemLabel));
    } else {
      setSelectedItems([...selectedItems, itemLabel]);
    }
  };

  const handleSubmit = async () => {
    setPhase('scoring');
    setError(null);

    // Get correct items
    const correctItems = gridItems.filter(item => item.isCorrect).map(item => item.label);

    try {
      const prompt = buildFilterScorerPrompt({
        targetPlayerName: targetPlayer.name,
        rule,
        selectedItems,
        correctItems,
      });

      const response = await sendChatRequest([
        { role: 'system', content: prompt },
        { role: 'user', content: 'Score this filter attempt now.' },
      ], {
        toolChoice: 'none',
      });

      const parsed = parseFilterScoreResponse(response.text);

      if (!parsed) {
        throw new Error('Invalid score response from AI');
      }

      // Update score
      updatePlayerScore(targetPlayer.id, parsed.score);

      const gameResult = toMiniGameResult(parsed, rule, correctItems);
      setResult(gameResult);
      setPhase('result');
    } catch (err) {
      console.error('Failed to score puzzle:', err);
      // Fallback scoring
      const correctSelections = selectedItems.filter(item => correctItems.includes(item));
      const wrongSelections = selectedItems.filter(item => !correctItems.includes(item));

      const fallbackScore = Math.min(5, Math.max(0,
        Math.round(((correctSelections.length * 2) - wrongSelections.length) / gridItems.length * 5)
      ));

      const fallbackResult: MiniGameResult = {
        score: fallbackScore,
        maxScore: 5,
        commentary: 'The Logic Master nods thoughtfully...',
        correctAnswer: `Rule: "${rule}"`,
        bonusInfo: `Correct items: ${correctItems.join(', ')}`,
      };
      updatePlayerScore(targetPlayer.id, fallbackScore);
      setResult(fallbackResult);
      setPhase('result');
    }
  };

  const handleComplete = () => {
    if (result) {
      if (turnId) {
        const correctItems = gridItems.filter(item => item.isCorrect).map(item => item.label);
        const duration = turnStartTime ? (Date.now() - turnStartTime) / 1000 : undefined;
        completeTurn(
          turnId,
          {
            rule,
            hint,
            gridItems,
            selectedItems,
            correctItems,
            score: result.score,
            commentary: result.commentary,
          },
          duration
        );
      }
      onComplete(result);
    }
  };

  // Score color based on value (cyan/teal theme)
  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-cyan-400';
    if (score >= 2) return 'text-cyan-500';
    return 'text-alert';
  };

  const getScoreBg = (score: number) => {
    if (score >= 4) return 'bg-cyan-400/20 border-cyan-400/50';
    if (score >= 2) return 'bg-cyan-500/20 border-cyan-500/50';
    return 'bg-alert/20 border-alert/50';
  };

  // Calculate grid columns based on item count
  const getGridCols = () => {
    if (gridItems.length === 9) return 'grid-cols-3';
    if (gridItems.length <= 10) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  return (
    <div className="bg-void flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-steel-800 bg-void/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-cyan-400 uppercase tracking-wider">
              The Filter
            </p>
            <h2 className="text-xl font-bold text-frost">{targetPlayer.name}</h2>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs text-steel-500">Pass or Fail?</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {/* Loading Phase */}
          {phase === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-4"
            >
              <div className="flex justify-center space-x-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full bg-cyan-400 animate-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
              <p className="text-frost font-mono">The Logic Master calibrates...</p>
            </motion.div>
          )}

          {/* Intro Phase */}
          {phase === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gradient-to-br from-cyan-400/20 via-void to-cyan-500/10 flex flex-col items-center justify-center p-6 z-50 overflow-x-hidden overflow-y-auto"
            >
              {/* Animated background */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute top-1/3 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute bottom-1/4 right-1/3 w-48 h-48 bg-cyan-600/30 rounded-full blur-3xl"
                  animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.6, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="relative z-10 text-center space-y-6 max-w-lg"
              >
                {/* Mini-game badge */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-block px-4 py-2 rounded-full bg-cyan-500/30 border border-cyan-400"
                >
                  <span className="font-mono text-sm text-cyan-400 uppercase tracking-widest">
                    Mini-Game
                  </span>
                </motion.div>

                {/* Game icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.3 }}
                  className="text-7xl"
                >
                  🎯
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-4xl md:text-5xl font-black text-frost"
                >
                  The Filter
                </motion.h1>

                {/* The Rule */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="glass rounded-xl p-6 border border-cyan-400/30 space-y-3"
                >
                  <p className="font-mono text-xs text-cyan-400 uppercase">The Rule</p>
                  <p className="text-frost text-2xl font-bold">
                    {rule}
                  </p>
                  {hint && (
                    <p className="text-steel-500 text-sm italic">Hint: {hint}</p>
                  )}
                </motion.div>

                {/* Instructions */}
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-steel-400"
                >
                  Select ALL items that pass the filter
                </motion.p>

                {/* Place phone reminder */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.65 }}
                  className="flex items-center justify-center gap-2 text-steel-500"
                >
                  <span className="text-lg">📱</span>
                  <p className="text-sm">Place phone on table so everyone can see!</p>
                </motion.div>

                {/* Start button */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  onClick={() => setPhase('playing')}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-void font-bold py-4 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
                >
                  Apply the Filter
                </motion.button>

                {onSkip && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    onClick={onSkip}
                    className="text-steel-500 hover:text-frost text-sm py-2"
                  >
                    Skip this challenge
                  </motion.button>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* Playing Phase - 3x3 or 3x4 Grid */}
          {phase === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl space-y-6"
            >
              {/* Rule reminder */}
              <div className="glass rounded-xl p-4 border border-cyan-400/30 text-center">
                <p className="font-mono text-xs text-cyan-400 uppercase mb-1">Select items that...</p>
                <p className="text-frost text-xl font-bold">{rule}</p>
              </div>

              {/* Selection count */}
              <div className="text-center">
                <p className="text-steel-400 text-sm">
                  {selectedItems.length} items selected
                </p>
              </div>

              {/* Grid */}
              <div className={`grid ${getGridCols()} gap-3`}>
                {gridItems.map((item, index) => {
                  const isSelected = selectedItems.includes(item.label);
                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleItemClick(item.label)}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        aspect-square rounded-lg font-medium text-sm p-2
                        flex items-center justify-center text-center
                        transition-all duration-200
                        ${isSelected
                          ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                          : 'bg-steel-800/50 border-2 border-steel-700 text-frost hover:border-cyan-500/50'
                        }
                      `}
                    >
                      {item.label}
                    </motion.button>
                  );
                })}
              </div>

              {/* Submit Button */}
              <motion.button
                onClick={handleSubmit}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-void font-bold py-4 px-6 rounded-xl transition-all"
              >
                Submit Filter
              </motion.button>
            </motion.div>
          )}

          {/* Scoring Phase */}
          {phase === 'scoring' && (
            <motion.div
              key="scoring"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-4"
            >
              <div className="flex justify-center space-x-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full bg-cyan-400 animate-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
              <p className="text-frost font-mono">The Logic Master evaluates...</p>
            </motion.div>
          )}

          {/* Result Phase */}
          {phase === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-lg space-y-6"
            >
              {/* Score Display */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className={`rounded-xl p-8 border-2 ${getScoreBg(result.score)} text-center`}
              >
                <p className="font-mono text-xs text-steel-500 uppercase mb-2">Score</p>
                <p className={`text-6xl font-black ${getScoreColor(result.score)}`}>
                  {result.score}/{result.maxScore}
                </p>
              </motion.div>

              {/* Commentary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass rounded-xl p-6 border border-steel-800"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎯</span>
                  <p className="text-frost text-lg">{result.commentary}</p>
                </div>
              </motion.div>

              {/* Rule Revealed */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass rounded-xl p-6 border border-cyan-400/30"
              >
                <p className="font-mono text-xs text-cyan-400 uppercase mb-2">The Rule Was</p>
                <p className="text-frost text-xl font-bold">{rule}</p>
                {result.bonusInfo && (
                  <p className="text-steel-400 text-sm mt-3">{result.bonusInfo}</p>
                )}
              </motion.div>

              {/* Continue Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={handleComplete}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-void font-bold py-4 px-6 rounded-xl transition-all"
              >
                Continue
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        {error && (
          <div className="fixed bottom-6 left-6 right-6 glass rounded-xl p-4 border border-alert">
            <p className="text-alert text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
