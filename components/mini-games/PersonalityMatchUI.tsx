'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useGameStore } from '@/lib/store';
import { sendChatRequest } from '@/lib/ai/client';
import {
  getTurnsAboutPlayer,
  buildPersonalityWordGeneratorPrompt,
  parsePersonalityWordGeneratorResponse,
  buildPersonalityMatchPrompt,
  parsePersonalityMatchResponse,
  toMiniGameResult,
} from '@/lib/mini-games/personality-match';
import type { MiniGameResult } from '@/lib/mini-games/types';

interface Player {
  id: string;
  name: string;
  role?: string;
  avatar?: number;
}

interface PersonalityMatchUIProps {
  /** Player answering the challenge */
  targetPlayer: Player;

  /** Player whose personality is being matched */
  subjectPlayer: Player;

  /** All players (for context) */
  allPlayers: Player[];

  /** Called when challenge completes */
  onComplete: (result: MiniGameResult) => void;

  /** Called if user wants to skip */
  onSkip?: () => void;
}

type MatchPhase = 'intro' | 'selecting' | 'scoring' | 'result';

/**
 * Personality Match UI Component
 *
 * Flow:
 * 1. Intro - Show the challenge
 * 2. Selecting - Player picks ALL words that match
 * 3. Scoring - AI evaluates based on previous turns
 * 4. Result - Show score with commentary
 */
export function PersonalityMatchUI({
  targetPlayer,
  subjectPlayer,
  allPlayers,
  onComplete,
  onSkip,
}: PersonalityMatchUIProps) {
  const [phase, setPhase] = useState<MatchPhase>('intro');
  const [words, setWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [result, setResult] = useState<MiniGameResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnId, setTurnId] = useState<string | null>(null);
  const [turnStartTime, setTurnStartTime] = useState<number | null>(null);

  const turns = useGameStore((state) => state.turns);
  const scores = useGameStore((state) => state.scores);
  const addTurn = useGameStore((state) => state.addTurn);
  const completeTurn = useGameStore((state) => state.completeTurn);
  const updatePlayerScore = useGameStore((state) => state.updatePlayerScore);

  // Generate word grid on mount using AI
  useEffect(() => {
    const generateWords = async () => {
      try {
        // Get relevant turns about the subject player for context
        const relevantTurns = getTurnsAboutPlayer(
          turns.filter((t) => t.status === 'completed'),
          subjectPlayer.id,
          subjectPlayer.name
        );

        const prompt = buildPersonalityWordGeneratorPrompt({
          subjectPlayerName: subjectPlayer.name,
          subjectPlayerRole: subjectPlayer.role,
          relevantTurns,
          allPlayers,
        });

        const response = await sendChatRequest([
          { role: 'system', content: prompt },
          { role: 'user', content: 'Generate the 16 personality words now.' },
        ], {
          toolChoice: 'none',
        });

        const parsed = parsePersonalityWordGeneratorResponse(response.text);

        if (parsed && parsed.words.length === 16) {
          setWords(parsed.words);
        } else {
          // Fallback words if AI fails
          setWords([
            'Caring', 'Stubborn', 'Creative', 'Organized',
            'Funny', 'Reserved', 'Loyal', 'Anxious',
            'Bold', 'Patient', 'Dramatic', 'Generous',
            'Sarcastic', 'Thoughtful', 'Competitive', 'Chill'
          ]);
        }
      } catch (err) {
        console.error('Failed to generate words:', err);
        // Fallback words
        setWords([
          'Caring', 'Stubborn', 'Creative', 'Organized',
          'Funny', 'Reserved', 'Loyal', 'Anxious',
          'Bold', 'Patient', 'Dramatic', 'Generous',
          'Sarcastic', 'Thoughtful', 'Competitive', 'Chill'
        ]);
      }
    };

    generateWords();
  }, [subjectPlayer.id, subjectPlayer.name, subjectPlayer.role, allPlayers, turns]);

  useEffect(() => {
    if (words.length > 0 && !turnId) {
      const createdTurnId = addTurn({
        playerId: targetPlayer.id,
        playerName: targetPlayer.name,
        templateType: 'personality_match',
        prompt: `Select all words that describe ${subjectPlayer.name}.`,
        templateParams: {
          wordOptions: words,
          subjectPlayerId: subjectPlayer.id,
          subjectPlayerName: subjectPlayer.name,
        },
      });
      setTurnId(createdTurnId);
      setTurnStartTime(Date.now());
    }
  }, [addTurn, subjectPlayer.id, subjectPlayer.name, targetPlayer.id, targetPlayer.name, turnId, words]);

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
      // Get relevant turns about the subject player
      const relevantTurns = getTurnsAboutPlayer(
        turns.filter((t) => t.status === 'completed'),
        subjectPlayer.id,
        subjectPlayer.name
      );

      const prompt = buildPersonalityMatchPrompt({
        subjectPlayerName: subjectPlayer.name,
        selectedWords,
        relevantTurns,
        allPlayers,
        scores,
      });

      const response = await sendChatRequest([
        { role: 'system', content: prompt },
        { role: 'user', content: 'Score these personality word selections now.' },
      ], {
        toolChoice: 'none', // Just need text response
      });

      const parsed = parsePersonalityMatchResponse(response.text);

      if (!parsed) {
        throw new Error('Invalid response from AI');
      }

      // Update score
      updatePlayerScore(targetPlayer.id, parsed.score);

      const gameResult = toMiniGameResult(parsed);
      setResult(gameResult);
      setPhase('result');
    } catch (err) {
      console.error('Failed to score personality match:', err);
      // Fallback scoring
      const fallbackResult: MiniGameResult = {
        score: 2,
        maxScore: 5,
        commentary: 'Technical difficulties! Points for trying.',
      };
      updatePlayerScore(targetPlayer.id, 2);
      setResult(fallbackResult);
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
            wordOptions: words,
            selectedWords,
            score: result.score,
            commentary: result.commentary,
            subjectPlayerId: subjectPlayer.id,
            subjectPlayerName: subjectPlayer.name,
          },
          duration
        );
      }
      onComplete(result);
    }
  };

  // Score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-mint';
    if (score >= 2) return 'text-glitch';
    return 'text-alert';
  };

  const getScoreBg = (score: number) => {
    if (score >= 4) return 'bg-mint/20 border-mint/50';
    if (score >= 2) return 'bg-glitch/20 border-glitch/50';
    return 'bg-alert/20 border-alert/50';
  };

  return (
    <div className="bg-void flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-steel-800 bg-void/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-mint uppercase tracking-wider">
              Personality Match
            </p>
            <h2 className="text-xl font-bold text-frost">{targetPlayer.name}</h2>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs text-steel-500">Matching</p>
            <p className="text-frost font-bold">{subjectPlayer.name}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {/* Intro Phase - Dramatic Full Screen */}
          {phase === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gradient-to-br from-mint/20 via-void to-mint/10 flex flex-col items-center justify-center p-6 z-50 overflow-hidden"
            >
              {/* Animated background elements */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute top-1/3 left-1/3 w-64 h-64 bg-mint/20 rounded-full blur-3xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-mint/30 rounded-full blur-3xl"
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
                  className="inline-block px-4 py-2 rounded-full bg-mint/30 border border-mint"
                >
                  <span className="font-mono text-sm text-mint uppercase tracking-widest">
                    Mini-Game
                  </span>
                </motion.div>

                {/* Subject Player Avatar */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.3 }}
                  className="relative"
                >
                  <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-mint shadow-[0_0_30px_rgba(0,255,170,0.4)] mx-auto">
                    <Image
                      src={`/avatars/${subjectPlayer.avatar || 1}.png`}
                      alt={subjectPlayer.name}
                      width={112}
                      height={112}
                      className="object-cover"
                    />
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-3"
                  >
                    <p className="text-mint font-bold text-xl">{subjectPlayer.name}</p>
                  </motion.div>
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-3xl md:text-4xl font-black text-frost"
                >
                  Personality Match
                </motion.h1>

                {/* Description */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="glass rounded-xl p-5 border border-mint/30 space-y-3"
                >
                  <p className="text-steel-300 text-lg">
                    How well do you know <span className="text-mint font-bold">{subjectPlayer.name}</span>?
                  </p>
                  <p className="text-steel-500 text-sm">
                    Select ALL the words that match their personality. No limit - pick as many as you think fit!
                  </p>
                </motion.div>

                {/* Place phone reminder */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="flex items-center justify-center gap-2 text-steel-500"
                >
                  <span className="text-lg">📱</span>
                  <p className="text-sm">Place phone on table so everyone can see!</p>
                </motion.div>

                {/* Start button */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  onClick={() => setPhase('selecting')}
                  className="w-full bg-mint hover:bg-mint/90 text-void font-bold py-4 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(0,255,170,0.3)] hover:shadow-[0_0_30px_rgba(0,255,170,0.5)]"
                >
                  Let's Go!
                </motion.button>

                {onSkip && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    onClick={onSkip}
                    className="text-steel-500 hover:text-frost text-sm py-2"
                  >
                    Skip this challenge
                  </motion.button>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* Selecting Phase */}
          {phase === 'selecting' && (
            <motion.div
              key="selecting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl space-y-6"
            >
              {/* Question with Subject Avatar */}
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-mint/50">
                    <Image
                      src={`/avatars/${subjectPlayer.avatar || 1}.png`}
                      alt={subjectPlayer.name}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-frost">
                    Which words describe {subjectPlayer.name}?
                  </h3>
                </div>
                <p className="text-mint font-mono text-sm">
                  {selectedWords.length} selected
                </p>
              </div>

              {/* Word Grid - 4x4 */}
              <div className="grid grid-cols-4 gap-2 md:gap-3">
                {words.map((word, index) => {
                  const isSelected = selectedWords.includes(word);
                  return (
                    <motion.button
                      key={word}
                      onClick={() => handleWordClick(word)}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        aspect-square rounded-xl font-bold text-xs md:text-sm
                        transition-all duration-200 relative overflow-hidden p-2
                        flex items-center justify-center text-center
                        ${
                          isSelected
                            ? 'bg-mint border-2 border-mint text-void shadow-glow'
                            : 'bg-void-light border-2 border-steel-800 text-frost hover:border-mint/50'
                        }
                      `}
                    >
                      {/* Selection indicator */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-void flex items-center justify-center"
                        >
                          <svg
                            className="w-2.5 h-2.5 text-mint"
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
                      <span className="relative z-10">{word}</span>
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
                className="w-full bg-mint hover:bg-mint/90 disabled:bg-steel-800 disabled:cursor-not-allowed text-void font-bold py-4 px-6 rounded-xl transition-all"
              >
                {selectedWords.length === 0
                  ? 'Select at least one word'
                  : `Submit ${selectedWords.length} word${selectedWords.length > 1 ? 's' : ''}`}
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
                    className="w-4 h-4 rounded-full bg-mint animate-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
              <p className="text-frost font-mono">The Analyst is judging...</p>
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
                transition={{ delay: 0.4 }}
                className="glass rounded-xl p-6 border border-steel-800"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔍</span>
                  <p className="text-frost text-lg">{result.commentary}</p>
                </div>
              </motion.div>

              {/* Selected Words Summary with Avatar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass rounded-xl p-5 border border-steel-800"
              >
                <div className="flex items-start gap-4">
                  {/* Subject Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-mint/50">
                      <Image
                        src={`/avatars/${subjectPlayer.avatar || 1}.png`}
                        alt={subjectPlayer.name}
                        width={56}
                        height={56}
                        className="object-cover"
                      />
                    </div>
                  </div>
                  {/* Words */}
                  <div className="flex-1">
                    <p className="font-mono text-xs text-steel-500 uppercase mb-2">
                      Your picks for {subjectPlayer.name}:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedWords.map((word) => (
                        <span
                          key={word}
                          className="px-2 py-1 rounded-lg bg-mint/20 text-mint text-sm font-mono"
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Best/Worst Pick */}
              {result.correctAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="glass rounded-xl p-4 border border-steel-800"
                >
                  <p className="text-frost text-sm">{result.correctAnswer}</p>
                  {result.bonusInfo && (
                    <p className="text-sm text-mint mt-2">{result.bonusInfo}</p>
                  )}
                </motion.div>
              )}

              {/* Continue Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={handleComplete}
                className="w-full bg-mint hover:bg-mint/90 text-void font-bold py-4 px-6 rounded-xl transition-all"
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
