'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { sendChatRequest } from '@/lib/ai/client';
import {
  buildCrypticGeneratorPrompt,
  buildCrypticScorerPrompt,
  parseCrypticGeneratorResponse,
  parseCrypticScoreResponse,
  toMiniGameResult,
  type WordScore,
} from '@/lib/mini-games/cryptic-connection';
import type { MiniGameResult } from '@/lib/mini-games/types';

interface Player {
  id: string;
  name: string;
  role?: string;
}

interface CrypticConnectionUIProps {
  /** Player answering the challenge */
  targetPlayer: Player;

  /** All players (for context) */
  allPlayers: Player[];

  /** Called when challenge completes */
  onComplete: (result: MiniGameResult) => void;

  /** Called if user wants to skip */
  onSkip?: () => void;
}

type CrypticPhase = 'loading' | 'intro' | 'playing' | 'scoring' | 'result';

/**
 * Cryptic Connection UI Component
 *
 * Flow:
 * 1. Loading - AI generates cryptic clue + 25 words
 * 2. Intro - Show the cryptic challenge
 * 3. Playing - Player selects words from 5x5 grid
 * 4. Scoring - AI evaluates with fuzzy logic
 * 5. Result - Show score with revealed answer
 */
export function CrypticConnectionUI({
  targetPlayer,
  allPlayers,
  onComplete,
  onSkip,
}: CrypticConnectionUIProps) {
  const [phase, setPhase] = useState<CrypticPhase>('loading');
  const [mysteryWord, setMysteryWord] = useState('');
  const [hint, setHint] = useState<string | undefined>();
  const [words, setWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [result, setResult] = useState<MiniGameResult | null>(null);
  const [breakdown, setBreakdown] = useState<WordScore[]>([]);
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
    if (mysteryWord && words.length > 0 && !turnId) {
      const createdTurnId = addTurn({
        playerId: targetPlayer.id,
        playerName: targetPlayer.name,
        templateType: 'cryptic_connection',
        prompt: `Find words connected to "${mysteryWord}".`,
        templateParams: {
          mysteryWord,
          hint,
          wordOptions: words,
        },
      });
      setTurnId(createdTurnId);
      setTurnStartTime(Date.now());
    }
  }, [addTurn, hint, mysteryWord, targetPlayer.id, targetPlayer.name, turnId, words]);

  const generatePuzzle = async () => {
    setPhase('loading');
    setError(null);

    try {
      const prompt = buildCrypticGeneratorPrompt({
        targetPlayerName: targetPlayer.name,
        allPlayers,
        scores,
      });

      const response = await sendChatRequest([
        { role: 'system', content: prompt },
        { role: 'user', content: 'Generate a cryptic puzzle now.' },
      ], {
        toolChoice: 'none',
      });

      const parsed = parseCrypticGeneratorResponse(response.text);

      if (!parsed) {
        throw new Error('Invalid puzzle response from AI');
      }

      setMysteryWord(parsed.mysteryWord);
      setHint(parsed.hint);
      setWords(parsed.words);
      setPhase('intro');
    } catch (err) {
      console.error('Failed to generate puzzle:', err);
      // Fallback puzzle
      setMysteryWord('BAR');
      setHint('Think compounds and phrases');
      setWords([
        'soap', 'tender', 'mars', 'exam', 'stool',
        'none', 'raiser', 'code', 'bell', 'space',
        'alcohol', 'cloud', 'puppy', 'tuesday', 'garden',
        'mitzvah', 'graph', 'music', 'harbor', 'iron',
        'gold', 'silver', 'steel', 'top', 'crow',
      ]);
      setPhase('intro');
    }
  };

  const handleWordClick = (word: string) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter((w) => w !== word));
    } else {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const handleSubmit = async () => {
    if (selectedWords.length === 0) return;

    setPhase('scoring');
    setError(null);

    try {
      const prompt = buildCrypticScorerPrompt({
        targetPlayerName: targetPlayer.name,
        mysteryWord,
        selectedWords,
        allWords: words,
      });

      const response = await sendChatRequest([
        { role: 'system', content: prompt },
        { role: 'user', content: 'Score this puzzle attempt now.' },
      ], {
        toolChoice: 'none',
      });

      const parsed = parseCrypticScoreResponse(response.text);

      if (!parsed) {
        throw new Error('Invalid score response from AI');
      }

      // Update score
      updatePlayerScore(targetPlayer.id, parsed.totalScore);

      const gameResult = toMiniGameResult(parsed, mysteryWord);
      setResult(gameResult);
      setBreakdown(parsed.breakdown);
      setPhase('result');
    } catch (err) {
      console.error('Failed to score puzzle:', err);
      // Fallback scoring
      const fallbackScore = Math.min(5, Math.max(1, selectedWords.length / 2));
      const fallbackResult: MiniGameResult = {
        score: fallbackScore,
        maxScore: 5,
        commentary: 'The Fuzzy Judge considers your choices...',
        correctAnswer: `Mystery word: ${mysteryWord.toUpperCase()}`,
      };
      updatePlayerScore(targetPlayer.id, fallbackScore);
      setResult(fallbackResult);
      setBreakdown(selectedWords.map(w => ({
        word: w,
        points: 2,
        reason: 'Connection unclear',
      })));
      setPhase('result');
    }
  };

  const handleComplete = () => {
    if (result) {
      if (turnId) {
        const duration = turnStartTime ? (Date.now() - turnStartTime) / 1000 : undefined;
        completeTurn(
          turnId,
          {
            mysteryWord,
            hint,
            wordOptions: words,
            selectedWords,
            score: result.score,
            commentary: result.commentary,
            breakdown,
          },
          duration
        );
      }
      onComplete(result);
    }
  };

  // Score color based on value (purple/mystery theme)
  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-violet-400';
    if (score >= 2) return 'text-violet-500';
    return 'text-alert';
  };

  const getScoreBg = (score: number) => {
    if (score >= 4) return 'bg-violet-400/20 border-violet-400/50';
    if (score >= 2) return 'bg-violet-500/20 border-violet-500/50';
    return 'bg-alert/20 border-alert/50';
  };

  return (
    <div className="bg-void flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-steel-800 bg-void/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-violet-400 uppercase tracking-wider">
              Cryptic Connection
            </p>
            <h2 className="text-xl font-bold text-frost">{targetPlayer.name}</h2>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs text-steel-500">Find the pattern</p>
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
                    className="w-4 h-4 rounded-full bg-violet-400 animate-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
              <p className="text-frost font-mono">The Riddler weaves a mystery...</p>
            </motion.div>
          )}

          {/* Intro Phase - Dramatic Full Screen */}
          {phase === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gradient-to-br from-violet-500/20 via-void to-violet-600/10 flex flex-col items-center justify-center p-6 z-50 overflow-x-hidden overflow-y-auto"
            >
              {/* Animated background elements */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute top-1/3 left-1/4 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute bottom-1/4 right-1/3 w-48 h-48 bg-violet-600/30 rounded-full blur-3xl"
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
                  className="inline-block px-4 py-2 rounded-full bg-violet-500/30 border border-violet-400"
                >
                  <span className="font-mono text-sm text-violet-400 uppercase tracking-widest">
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
                  🔮
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-4xl md:text-5xl font-black text-frost"
                >
                  Cryptic Connection
                </motion.h1>

                {/* The Mystery Word */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="glass rounded-xl p-6 border border-violet-400/30 space-y-3"
                >
                  <p className="font-mono text-xs text-violet-400 uppercase">Mystery Word</p>
                  <p className="text-frost text-5xl font-black tracking-wider">
                    {mysteryWord.toUpperCase()}
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
                  Select words that connect to this mystery word
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
                  className="w-full bg-violet-500 hover:bg-violet-400 text-frost font-bold py-4 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
                >
                  Solve the Riddle
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

          {/* Playing Phase - 5x5 Grid */}
          {phase === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl space-y-6"
            >
              {/* Mystery word reminder */}
              <div className="glass rounded-xl p-4 border border-violet-400/30 text-center">
                <p className="font-mono text-xs text-violet-400 uppercase mb-1">Find connections to...</p>
                <p className="text-frost text-3xl font-black tracking-wider">{mysteryWord.toUpperCase()}</p>
              </div>

              {/* Selection count */}
              <div className="text-center">
                <p className="text-steel-400 text-sm">
                  {selectedWords.length} words selected
                </p>
              </div>

              {/* 5x5 Word Grid - Responsive: 3 cols on mobile, 4 on tablet, 5 on desktop */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {words.map((word, index) => {
                  const isSelected = selectedWords.includes(word);
                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleWordClick(word)}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        aspect-square rounded-xl font-medium text-xs md:text-sm p-1
                        transition-all duration-200 relative overflow-hidden
                        ${
                          isSelected
                            ? 'bg-violet-500 border-2 border-violet-400 text-frost shadow-[0_0_10px_rgba(139,92,246,0.4)]'
                            : 'bg-void-light border-2 border-steel-800 text-frost hover:border-violet-400/50'
                        }
                      `}
                    >
                      <span className="relative z-10 break-words leading-tight">{word}</span>

                      {/* Selection indicator */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-void flex items-center justify-center"
                        >
                          <svg
                            className="w-2.5 h-2.5 text-violet-400"
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
                    </motion.button>
                  );
                })}
              </div>

              {/* Submit Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: selectedWords.length > 0 ? 1 : 0.5 }}
                onClick={handleSubmit}
                disabled={selectedWords.length === 0}
                className="w-full bg-violet-500 hover:bg-violet-400 disabled:bg-steel-800 disabled:cursor-not-allowed text-frost font-bold py-4 px-6 rounded-xl transition-all"
              >
                {selectedWords.length > 0 ? `Submit ${selectedWords.length} words` : 'Select at least 1 word'}
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
                    className="w-4 h-4 rounded-full bg-violet-400 animate-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
              <p className="text-frost font-mono">The Fuzzy Judge evaluates...</p>
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
                  <span className="text-2xl">🔮</span>
                  <p className="text-frost text-lg">{result.commentary}</p>
                </div>
              </motion.div>

              {/* Word-by-word breakdown */}
              {breakdown.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="glass rounded-xl p-4 border border-steel-800 space-y-2"
                >
                  <p className="font-mono text-xs text-violet-400 uppercase mb-2">Word Breakdown</p>
                  {breakdown.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-frost font-medium">{item.word}</span>
                      <div className="flex items-center gap-2">
                        <span className={`${item.points >= 4 ? 'text-green-400' : item.points >= 2 ? 'text-violet-400' : 'text-steel-500'} font-mono text-xs`}>
                          {item.points}pts
                        </span>
                        <span className="text-steel-500 text-xs max-w-[180px] truncate">{item.reason}</span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Mystery Word Revealed */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass rounded-xl p-6 border border-violet-400/30"
              >
                <p className="font-mono text-xs text-violet-400 uppercase mb-2">The Mystery Word Was</p>
                <p className="text-frost text-3xl font-black tracking-wider">{mysteryWord.toUpperCase()}</p>
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
                className="w-full bg-violet-500 hover:bg-violet-400 text-frost font-bold py-4 px-6 rounded-xl transition-all"
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
