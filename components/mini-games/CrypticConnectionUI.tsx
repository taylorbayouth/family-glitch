'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { IntroScreen } from '@/components/mini-games/shared/IntroScreen';
import { GameHeader } from '@/components/GameHeader';
import { getTheme } from '@/lib/mini-games/themes';
import crypticIcon from '@/lib/mini-games/cryptic-connection/icon.png';
import { sendChatRequest } from '@/lib/ai/client';
import type { MiniGamePlayer } from '@/lib/mini-games/registry';
import {
  buildCrypticGeneratorPrompt,
  buildCrypticScorerPrompt,
  parseCrypticGeneratorResponse,
  parseCrypticScoreResponse,
  toMiniGameResult,
  getPriorCrypticGames,
  getAllMiniGamesPlayed,
  type WordScore,
} from '@/lib/mini-games/cryptic-connection';
import type { MiniGameResult } from '@/lib/mini-games/types';

interface CrypticConnectionUIProps {
  /** Player answering the challenge */
  targetPlayer: MiniGamePlayer;

  /** All players (for context) */
  allPlayers: MiniGamePlayer[];

  /** Called when challenge completes */
  onComplete: (result: MiniGameResult) => void;

  /** Called if user wants to skip */
  onSkip?: () => void;

  turnNumber?: number;
}

type CrypticPhase = 'loading' | 'intro' | 'playing' | 'scoring' | 'result';

/**
 * Cryptic Connection UI Component
 *
 * Flow:
 * 1. Loading - AI generates core idea + 25 words
 * 2. Intro - Show the brain teaser challenge
 * 3. Playing - Player selects words from 5x5 grid
 * 4. Scoring - AI evaluates with fuzzy logic
 * 5. Result - Show score with revealed answer
 */
export function CrypticConnectionUI({
  targetPlayer,
  allPlayers,
  onComplete,
  onSkip,
  turnNumber,
}: CrypticConnectionUIProps) {
  const [phase, setPhase] = useState<CrypticPhase>('loading');
  const [mysteryWord, setMysteryWord] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [answerKey, setAnswerKey] = useState<string[]>([]);
  const [trickKey, setTrickKey] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [result, setResult] = useState<MiniGameResult | null>(null);
  const [breakdown, setBreakdown] = useState<WordScore[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [turnId, setTurnId] = useState<string | null>(null);
  const [turnStartTime, setTurnStartTime] = useState<number | null>(null);

  const scores = useGameStore((state) => state.scores);
  const storedTurns = useGameStore((state) => state.turns);
  const transitionResponses = useGameStore((state) => state.transitionResponses);
  const addTurn = useGameStore((state) => state.addTurn);
  const completeTurn = useGameStore((state) => state.completeTurn);
  const updatePlayerScore = useGameStore((state) => state.updatePlayerScore);
  const theme = getTheme('cryptic_connection');

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
          wordOptions: words,
          answerKey,
          trickKey,
        },
      });
      setTurnId(createdTurnId);
      setTurnStartTime(Date.now());
    }
  }, [
    addTurn,
    answerKey,
    mysteryWord,
    targetPlayer.id,
    targetPlayer.name,
    trickKey,
    turnId,
    words,
  ]);

  const generatePuzzle = async () => {
    setPhase('loading');
    setError(null);

    try {
      const prompt = buildCrypticGeneratorPrompt({
        targetPlayerName: targetPlayer.name,
        targetPlayerAge: targetPlayer.age,
        targetPlayerRole: targetPlayer.role,
        allPlayers,
        scores,
        turns: storedTurns,
        priorCrypticGames: getPriorCrypticGames(storedTurns),
        allMiniGamesPlayed: getAllMiniGamesPlayed(storedTurns),
        transitionResponses,
      });

      const response = await sendChatRequest([
        { role: 'system', content: prompt },
        { role: 'user', content: 'Generate a brain teaser puzzle now.' },
      ], {
        toolChoice: 'none',
      });

      const parsed = parseCrypticGeneratorResponse(response.text);

      if (!parsed) {
        throw new Error('Invalid puzzle response from AI');
      }

      const uniqueAnswers = Array.from(new Set(parsed.answerKey));
      const uniqueTricks = Array.from(new Set(parsed.trickKey)).filter(
        (word) => !uniqueAnswers.includes(word)
      );

      const filteredAnswers = uniqueAnswers.filter((word) => parsed.words.includes(word));
      const filteredTricks = uniqueTricks.filter((word) => parsed.words.includes(word));

      if (filteredAnswers.length !== 8 || filteredTricks.length !== 5) {
        throw new Error('Invalid puzzle response from AI');
      }

      setMysteryWord(parsed.mysteryWord);
      setWords(parsed.words);
      setAnswerKey(filteredAnswers);
      setTrickKey(filteredTricks);
      setPhase('intro');
    } catch (err) {
      console.error('Failed to generate puzzle:', err);
      // Fallback puzzle
      setMysteryWord('BAR');
      setWords([
        'soap', 'tender', 'mars', 'exam', 'stool',
        'none', 'raiser', 'code', 'bell', 'space',
        'alcohol', 'cloud', 'puppy', 'tuesday', 'garden',
        'mitzvah', 'graph', 'music', 'harbor', 'iron',
        'gold', 'silver', 'steel', 'top', 'crow',
      ]);
      setAnswerKey(['mars', 'exam', 'stool', 'code', 'space', 'alcohol', 'gold', 'raiser']);
      setTrickKey(['iron', 'silver', 'steel', 'harbor', 'bell']);
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
        answerKey,
        trickKey,
      });

      const response = await sendChatRequest([
        { role: 'system', content: prompt },
        { role: 'user', content: 'Score this brain teaser attempt now.' },
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
            wordOptions: words,
            selectedWords,
            answerKey,
            trickKey,
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
    <div className="min-h-dvh h-dvh bg-void flex flex-col">
      {phase === 'scoring' && (
        <GameHeader currentPlayerId={targetPlayer.id} turnNumber={turnNumber} compact />
      )}

      <div className="flex-1 flex flex-col">
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

          {/* Intro Phase */}
          {phase === 'intro' && (
            <IntroScreen
              theme={theme}
              title="Cryptic Connection"
              description={`Select words connected to "${mysteryWord.toUpperCase()}".`}
              iconImage={crypticIcon}
              onStart={() => setPhase('playing')}
              onSkip={onSkip}
              startButtonText="Start"
            />
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
    </div>
  );
}
