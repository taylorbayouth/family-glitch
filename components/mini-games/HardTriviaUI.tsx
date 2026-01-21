'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import type { Turn } from '@/lib/types/game-state';
import type { MiniGameResult } from '@/lib/mini-games/types';
import type { MiniGamePlayer } from '@/lib/mini-games/registry';
import {
  buildHardTriviaGeneratorPrompt,
  buildHardTriviaScorerPrompt,
  parseHardTriviaGeneratorResponse,
  parseHardTriviaScoreResponse,
  toMiniGameResult,
  type HardTriviaGenerateResponse,
  type HardTriviaScoreResponse,
} from '@/lib/mini-games/hard-trivia';
import { sendChatRequest } from '@/lib/ai/client';
import type { MiniGameConfig } from '@/lib/mini-games/registry';

export interface HardTriviaConfig extends MiniGameConfig {
  intro?: string;
  turns?: Turn[];
}

interface HardTriviaUIProps {
  targetPlayer: MiniGamePlayer;
  allPlayers: MiniGamePlayer[];
  turns?: Turn[];
  onComplete: (result: MiniGameResult) => void;
}

type HardTriviaPhase = 'loading' | 'intro' | 'question' | 'scoring' | 'result';

export function HardTriviaUI({
  targetPlayer,
  allPlayers,
  turns = [],
  onComplete,
}: HardTriviaUIProps) {
  const [phase, setPhase] = useState<HardTriviaPhase>('loading');
  const [triviaData, setTriviaData] = useState<HardTriviaGenerateResponse | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [scoreData, setScoreData] = useState<HardTriviaScoreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnId, setTurnId] = useState<string | null>(null);
  const [turnStartTime, setTurnStartTime] = useState<number | null>(null);

  const addTurn = useGameStore((state) => state.addTurn);
  const completeTurn = useGameStore((state) => state.completeTurn);

  // Phase 1: Generate trivia question
  useEffect(() => {
    if (phase === 'loading') {
      generateTriviaQuestion();
    }
  }, [phase]);

  useEffect(() => {
    if (triviaData && !turnId) {
      const createdTurnId = addTurn({
        playerId: targetPlayer.id,
        playerName: targetPlayer.name,
        templateType: 'hard_trivia',
        prompt: triviaData.question,
        templateParams: {
          category: triviaData.category,
          options: triviaData.options,
        },
      });
      setTurnId(createdTurnId);
      setTurnStartTime(Date.now());
    }
  }, [addTurn, targetPlayer.id, targetPlayer.name, triviaData, turnId]);

  const generateTriviaQuestion = async () => {
    try {
      const prompt = buildHardTriviaGeneratorPrompt({
        targetPlayer,
        allPlayers,
        turns,
      });

      const response = await sendChatRequest([
        { role: 'system', content: prompt },
        { role: 'user', content: 'Generate the trivia question now as JSON.' },
      ], {
        toolChoice: 'none',
      });

      const parsedData = parseHardTriviaGeneratorResponse(response.text);
      setTriviaData(parsedData);
      setPhase('intro');
    } catch (err) {
      console.error('Failed to generate trivia question:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Phase 2: Score the answer
  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !triviaData) return;

    setPhase('scoring');

    try {
      const prompt = buildHardTriviaScorerPrompt({
        targetPlayer,
        question: triviaData.question,
        correctAnswer: triviaData.correct_answer,
        playerAnswer: selectedAnswer,
        options: triviaData.options,
      });

      const response = await sendChatRequest([
        { role: 'system', content: prompt },
        { role: 'user', content: 'Score the answer now as JSON.' },
      ], {
        toolChoice: 'none',
      });

      const parsedScore = parseHardTriviaScoreResponse(response.text);
      setScoreData(parsedScore);
      setPhase('result');
    } catch (err) {
      console.error('Failed to score answer:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleComplete = () => {
    if (scoreData) {
      if (turnId && triviaData) {
        const duration = turnStartTime ? (Date.now() - turnStartTime) / 1000 : undefined;
        completeTurn(
          turnId,
          {
            question: triviaData.question,
            options: triviaData.options,
            category: triviaData.category,
            playerAnswer: selectedAnswer,
            correctAnswer: triviaData.correct_answer,
            score: scoreData.points,
            commentary: scoreData.commentary,
          },
          duration
        );
      }
      onComplete(toMiniGameResult(scoreData));
    }
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-0 bg-void flex items-center justify-center p-4">
        <div className="glass rounded-xl p-6 border border-alert max-w-md">
          <h2 className="text-alert font-bold text-xl mb-2">Error</h2>
          <p className="text-frost mb-4">{error}</p>
          <button
            onClick={() => onComplete({ score: 0, maxScore: 5, commentary: 'Error occurred' })}
            className="w-full bg-steel-700 hover:bg-steel-600 text-frost font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (phase === 'loading' || !triviaData) {
    return (
      <div className="min-h-0 bg-void flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-frost font-mono">Preparing trivia question...</p>
        </motion.div>
      </div>
    );
  }

  // Intro phase - Dramatic Full Screen
  if (phase === 'intro') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-500/20 via-void to-cyan-600/10 flex flex-col items-center justify-center p-6 z-50 overflow-hidden">
        {/* Animated background elements */}
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
            🧠
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-4xl md:text-5xl font-black text-frost"
          >
            Hard Trivia
          </motion.h1>

          {/* Description */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-xl p-6 border border-cyan-400/30 space-y-3"
          >
            <p className="text-steel-300 text-lg">
              Time to test your knowledge, {targetPlayer.name}!
            </p>
            <p className="text-cyan-400 text-sm font-medium">
              Category: <span className="font-bold">{triviaData.category}</span>
            </p>
          </motion.div>

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
            onClick={() => setPhase('question')}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-void font-bold py-4 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
          >
            Show Question
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Question phase
  if (phase === 'question') {
    return (
      <div className="min-h-0 bg-void flex items-center justify-center p-4">
        <div className="scan-line" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-xl p-8 max-w-2xl w-full border border-cyan-500/30"
        >
          {/* Question */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🧠</span>
              </div>
              <h3 className="text-cyan-400 font-bold text-lg">Hard Trivia</h3>
            </div>
            <p className="text-frost text-xl font-bold leading-relaxed">
              {triviaData.question}
            </p>
          </motion.div>

          {/* Multiple choice options (2x2 grid) */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6"
          >
            {triviaData.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              return (
                <motion.button
                  key={index}
                  onClick={() => setSelectedAnswer(option)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'bg-cyan-500 border-cyan-400 text-void shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'bg-void-light border-steel-800 text-frost hover:border-cyan-500/50'
                  }`}
                >
                  <span className="font-mono text-xs text-steel-500 mb-1 block">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="font-medium">{option}</span>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Submit button */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={handleSubmitAnswer}
            disabled={!selectedAnswer}
            className={`w-full font-bold py-4 px-8 rounded-xl transition-all ${
              selectedAnswer
                ? 'bg-cyan-500 hover:bg-cyan-400 text-void shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]'
                : 'bg-steel-800 text-steel-600 cursor-not-allowed'
            }`}
          >
            {selectedAnswer ? 'Submit Answer' : 'Select an answer'}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Scoring phase
  if (phase === 'scoring') {
    return (
      <div className="min-h-0 bg-void flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-frost font-mono">Checking your answer...</p>
        </motion.div>
      </div>
    );
  }

  // Result phase
  if (phase === 'result' && scoreData) {
    const isCorrect = scoreData.correct;

    return (
      <div className="min-h-0 bg-void flex items-center justify-center p-4">
        <div className="scan-line" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`glass rounded-xl p-8 max-w-lg w-full border-2 ${
            isCorrect
              ? 'border-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.3)]'
              : 'border-alert shadow-[0_0_40px_rgba(239,68,68,0.2)]'
          }`}
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
              isCorrect
                ? 'bg-cyan-500/20 border-4 border-cyan-500'
                : 'bg-alert/20 border-4 border-alert'
            }`}
          >
            <span className="text-5xl">{isCorrect ? '✓' : '✗'}</span>
          </motion.div>

          {/* Result */}
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`text-3xl font-black text-center mb-4 ${
              isCorrect ? 'text-cyan-400' : 'text-alert'
            }`}
          >
            {isCorrect ? 'Correct!' : 'Wrong!'}
          </motion.h2>

          {/* Show correct answer if wrong */}
          {!isCorrect && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-4 p-4 bg-void-light rounded-lg border border-cyan-500/30"
            >
              <p className="text-steel-400 text-sm mb-1">Correct answer:</p>
              <p className="text-cyan-400 font-bold">{triviaData.correct_answer}</p>
            </motion.div>
          )}

          {/* Commentary */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-frost text-center mb-6"
          >
            {scoreData.commentary}
          </motion.p>

          {/* Points */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            className={`text-center mb-6 p-4 rounded-lg ${
              isCorrect ? 'bg-cyan-500/10' : 'bg-void-light'
            }`}
          >
            <span className={`text-4xl font-black ${isCorrect ? 'text-cyan-400' : 'text-steel-600'}`}>
              +{scoreData.points} points
            </span>
          </motion.div>

          {/* Continue button */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={handleComplete}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-void font-bold py-4 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
          >
            Continue
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return null;
}
