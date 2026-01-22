'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useGameStore } from '@/lib/store';
import { sendChatRequest } from '@/lib/ai/client';
import type { MiniGameResult } from '@/lib/mini-games/types';
import { IntroScreen } from '@/components/mini-games/shared/IntroScreen';
import { getTheme } from '@/lib/mini-games/themes';
import triviaIcon from '@/lib/mini-games/trivia-challenge/icon.png';
import {
  buildTriviaChallengePrompt,
  buildScoringPrompt,
  parseTriviaChallengeResponse,
  getPriorTriviaChallengeQuestions,
  getAllMiniGamesPlayed,
  type TriviaScoreResponse,
} from '@/lib/mini-games/trivia-challenge';
import type { Turn } from '@/lib/types/game-state';

interface Player {
  id: string;
  name: string;
  role?: string;
  avatar?: number;
}

interface TriviaChallengeUIProps {
  /** Player being challenged */
  targetPlayer: Player;

  /** The turn to use as source (from another player) */
  sourceTurn: Turn;

  /** All players (for context) */
  allPlayers: Player[];

  /** Called when challenge completes */
  onComplete: (result: MiniGameResult) => void;

  /** Called if user wants to skip */
  onSkip?: () => void;
}

type ChallengePhase = 'intro' | 'loading' | 'question' | 'answering' | 'scoring' | 'result';

/**
 * Trivia Challenge UI Component
 *
 * Handles the full challenge flow:
 * 1. Loading - AI generates question from turn data
 * 2. Question - Display the challenge
 * 3. Answering - Player types response
 * 4. Scoring - AI evaluates
 * 5. Result - Show score with commentary
 *
 * Uses the existing turns array - no separate facts store needed.
 */
export function TriviaChallengeUI({
  targetPlayer,
  sourceTurn,
  allPlayers,
  onComplete,
  onSkip,
}: TriviaChallengeUIProps) {
  const [phase, setPhase] = useState<ChallengePhase>('intro');
  const [question, setQuestion] = useState('');
  const [playerAnswer, setPlayerAnswer] = useState('');
  const [scoreResult, setScoreResult] = useState<TriviaScoreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnId, setTurnId] = useState<string | null>(null);
  const [turnStartTime, setTurnStartTime] = useState<number | null>(null);

  const scores = useGameStore((state) => state.scores);
  const storedTurns = useGameStore((state) => state.turns);
  const addTurn = useGameStore((state) => state.addTurn);
  const completeTurn = useGameStore((state) => state.completeTurn);
  const updatePlayerScore = useGameStore((state) => state.updatePlayerScore);

  // Start generating question when user clicks "Let's Go!"
  const handleStartChallenge = () => {
    setPhase('loading');
    generateQuestion();
  };

  const generateQuestion = async () => {
    setPhase('loading');
    setError(null);

    try {
      const prompt = buildTriviaChallengePrompt({
        targetPlayer,
        sourceTurn,
        allPlayers,
        scores,
        turns: storedTurns,
        priorTriviaChallengeQuestions: getPriorTriviaChallengeQuestions(storedTurns),
        allMiniGamesPlayed: getAllMiniGamesPlayed(storedTurns),
      });

      const response = await sendChatRequest([
        { role: 'system', content: prompt },
        { role: 'user', content: 'Generate the trivia question now.' },
      ], {
        toolChoice: 'none',
      });

      const parsed = parseTriviaChallengeResponse(response.text);

      if (!parsed || parsed.phase !== 'question') {
        throw new Error('Invalid question response from AI');
      }

      setQuestion(parsed.question);
      setPhase('question');

      if (!turnId) {
        const createdTurnId = addTurn({
          playerId: targetPlayer.id,
          playerName: targetPlayer.name,
          templateType: 'trivia_challenge',
          prompt: parsed.question,
          templateParams: {
            sourceTurnId: sourceTurn.turnId,
            sourcePlayerId: sourceTurn.playerId,
            sourcePlayerName: sourceTurn.playerName,
            sourcePrompt: sourceTurn.prompt,
          },
        });
        setTurnId(createdTurnId);
        setTurnStartTime(Date.now());
      }
    } catch (err) {
      console.error('Failed to generate question:', err);
      setError('Failed to generate question. Please try again.');
    }
  };

  const handleSubmitAnswer = async () => {
    if (!playerAnswer.trim()) return;

    setPhase('scoring');

    try {
      const systemPrompt = buildTriviaChallengePrompt({
        targetPlayer,
        sourceTurn,
        allPlayers,
        scores,
        turns: storedTurns,
        priorTriviaChallengeQuestions: getPriorTriviaChallengeQuestions(storedTurns),
        allMiniGamesPlayed: getAllMiniGamesPlayed(storedTurns),
      });

      const scoringPrompt = buildScoringPrompt(playerAnswer, {
        targetPlayer,
        sourceTurn,
        allPlayers,
        scores,
        turns: storedTurns,
        priorTriviaChallengeQuestions: getPriorTriviaChallengeQuestions(storedTurns),
        allMiniGamesPlayed: getAllMiniGamesPlayed(storedTurns),
      });

      const response = await sendChatRequest([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate the trivia question now.' },
        { role: 'assistant', content: JSON.stringify({ phase: 'question', question }) },
        { role: 'user', content: scoringPrompt },
      ], {
        toolChoice: 'none',
      });

      const parsed = parseTriviaChallengeResponse(response.text);

      if (!parsed || parsed.phase !== 'score') {
        throw new Error('Invalid score response from AI');
      }

      // Update game score immediately (real-time!)
      updatePlayerScore(targetPlayer.id, parsed.score);

      setScoreResult(parsed);
      setPhase('result');
    } catch (err) {
      console.error('Failed to score answer:', err);
      // Fallback scoring
      const fallbackResult: TriviaScoreResponse = {
        phase: 'score',
        score: 2,
        commentary: 'Technical difficulties! Have some points anyway.',
        correctAnswer: JSON.stringify(sourceTurn.response),
      };
      updatePlayerScore(targetPlayer.id, 2);
      setScoreResult(fallbackResult);
      setPhase('result');
    }
  };

  const handleComplete = () => {
    if (scoreResult) {
      if (turnId) {
        const duration = turnStartTime ? (Date.now() - turnStartTime) / 1000 : undefined;
        completeTurn(
          turnId,
          {
            question,
            playerAnswer,
            score: scoreResult.score,
            commentary: scoreResult.commentary,
            correctAnswer: scoreResult.correctAnswer,
            sourceTurnId: sourceTurn.turnId,
            sourcePlayerId: sourceTurn.playerId,
            sourcePlayerName: sourceTurn.playerName,
            sourcePrompt: sourceTurn.prompt,
            sourceAnswer: sourceTurn.response,
          },
          duration
        );
      }
      onComplete({
        score: scoreResult.score,
        maxScore: 5,
        commentary: scoreResult.commentary,
      });
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

  // Find the source player for avatar display
  const sourcePlayer = allPlayers.find(p => p.id === sourceTurn.playerId);
  const sourcePlayerAvatar = sourcePlayer?.avatar || 1;

  const theme = getTheme('trivia_challenge');

  // Intro screen (before loading)
  if (phase === 'intro') {
    return (
      <IntroScreen
        theme={theme}
        title="Trivia Challenge"
        description={`Guess what ${sourceTurn.playerName} would say. One question, 0-5 points.`}
        iconImage={triviaIcon}
        onStart={handleStartChallenge}
        onSkip={onSkip}
        startButtonText="Start"
      />
    );
  }

  return (
    <div className="bg-void flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-steel-800 bg-void/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-glitch uppercase tracking-wider">
              Trivia Challenge
            </p>
            <h2 className="text-xl font-bold text-frost">{targetPlayer.name}</h2>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs text-steel-500">About</p>
            <p className="text-frost">{sourceTurn.playerName}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 safe-bottom-gap">
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
                    className="w-4 h-4 rounded-full bg-glitch animate-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
              <p className="text-frost font-mono">The Quizmaster is thinking...</p>
            </motion.div>
          )}

          {/* Question Phase */}
          {phase === 'question' && (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-lg space-y-6"
            >
              <div className="glass rounded-xl p-6 border border-glitch/30 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎯</span>
                  <span className="font-mono text-xs text-glitch uppercase">Challenge</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-frost leading-relaxed">
                  {question}
                </h3>
              </div>

              <button
                onClick={() => setPhase('answering')}
                className="w-full bg-glitch hover:bg-glitch-bright text-frost font-bold py-4 px-6 rounded-xl transition-all"
              >
                I'm Ready to Answer
              </button>

              {onSkip && (
                <button
                  onClick={onSkip}
                  className="w-full text-steel-500 hover:text-frost text-sm py-2"
                >
                  Skip this challenge
                </button>
              )}
            </motion.div>
          )}

          {/* Answering Phase */}
          {phase === 'answering' && (
            <motion.div
              key="answering"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-lg space-y-6"
            >
              <div className="glass rounded-xl p-4 border border-steel-800">
                <p className="text-frost text-sm mb-2">{question}</p>
              </div>

              <div className="space-y-4">
                <textarea
                  value={playerAnswer}
                  onChange={(e) => setPlayerAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  className="w-full h-32 px-4 py-3 rounded-xl bg-void-light border border-steel-800 text-frost placeholder-steel-600 focus:border-glitch focus:outline-none resize-none"
                  autoFocus
                />

                <button
                  onClick={handleSubmitAnswer}
                  disabled={!playerAnswer.trim()}
                  className="w-full bg-glitch hover:bg-glitch-bright disabled:bg-steel-800 disabled:cursor-not-allowed text-frost font-bold py-4 px-6 rounded-xl transition-all"
                >
                  Submit Answer
                </button>
              </div>
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
                    className="w-4 h-4 rounded-full bg-glitch animate-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
              <p className="text-frost font-mono">Judging your answer...</p>
            </motion.div>
          )}

          {/* Result Phase */}
          {phase === 'result' && scoreResult && (
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
                className={`rounded-xl p-8 border-2 ${getScoreBg(scoreResult.score)} text-center`}
              >
                <p className="font-mono text-xs text-steel-500 uppercase mb-2">Score</p>
                <p className={`text-6xl font-black ${getScoreColor(scoreResult.score)}`}>
                  {scoreResult.score}/5
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
                  <span className="text-2xl">🤖</span>
                  <p className="text-frost text-lg">{scoreResult.commentary}</p>
                </div>
              </motion.div>

              {/* Correct Answer Reveal - Speech Bubble Style */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass rounded-xl p-5 border border-steel-800"
              >
                <p className="font-mono text-xs text-steel-500 uppercase mb-3">
                  What they actually said:
                </p>
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-glitch/50">
                      <Image
                        src={`/avatars/${sourcePlayerAvatar}.png`}
                        alt={sourceTurn.playerName}
                        width={56}
                        height={56}
                        className="object-cover"
                      />
                    </div>
                  </div>
                  {/* Speech bubble */}
                  <div className="flex-1 relative">
                    {/* Bubble pointer */}
                    <div className="absolute left-[-8px] top-4 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-void-light" />
                    <div className="bg-void-light rounded-xl p-4 relative">
                      <p className="text-glitch font-bold text-sm mb-1">
                        {sourceTurn.playerName}
                      </p>
                      <p className="text-frost">{scoreResult.correctAnswer}</p>
                    </div>
                  </div>
                </div>
                {scoreResult.bonusInfo && (
                  <p className="text-sm text-glitch mt-4 text-center">{scoreResult.bonusInfo}</p>
                )}
              </motion.div>

              {/* Continue Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={handleComplete}
                className="w-full bg-glitch hover:bg-glitch-bright text-frost font-bold py-4 px-6 rounded-xl transition-all"
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
            <button
              onClick={() => {
                setError(null);
                generateQuestion();
              }}
              className="text-frost text-sm underline mt-2"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
