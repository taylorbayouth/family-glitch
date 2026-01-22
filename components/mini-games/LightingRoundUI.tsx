'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { usePlayerStore } from '@/lib/store/player-store';
import { sendChatRequest } from '@/lib/ai/client';
import type { Turn } from '@/lib/types/game-state';
import type { MiniGameResult } from '@/lib/mini-games/types';
import type { MiniGameConfig, MiniGamePlayer } from '@/lib/mini-games/registry';
import { TimedBinaryTemplate } from '@/components/input-templates/TimedBinaryTemplate';
import { IntroScreen } from '@/components/mini-games/shared/IntroScreen';
import { LoadingSpinner } from '@/components/mini-games/shared/LoadingSpinner';
import { ScoreDisplay } from '@/components/mini-games/shared/ScoreDisplay';
import { CommentaryCard } from '@/components/mini-games/shared/CommentaryCard';
import { ErrorToast } from '@/components/mini-games/shared/ErrorToast';
import { getTheme } from '@/lib/mini-games/themes';
import lightingRoundIcon from '@/lib/mini-games/lighting-round/icon.png';
import {
  buildLightingRoundQuestionPrompt,
  parseLightingRoundQuestionResponse,
  getAllMiniGamesPlayed,
  type LightingRoundHistoryItem,
  type LightingRoundQuestionResponse,
} from '@/lib/mini-games/lighting-round';

export interface LightingRoundConfig extends MiniGameConfig {
  intro?: string;
  turns?: Turn[];
}

interface LightingRoundUIProps {
  targetPlayer: MiniGamePlayer;
  allPlayers: MiniGamePlayer[];
  turns?: Turn[];
  intro?: string;
  onComplete: (result: MiniGameResult) => void;
  onSkip?: () => void;
  turnNumber?: number;
}

type LightingRoundPhase = 'intro' | 'loading' | 'question' | 'feedback' | 'result' | 'error';

interface RoundResult extends LightingRoundHistoryItem {
  roundNumber: number;
  selectedText?: string;
  timedOut: boolean;
  isCorrect: boolean | null;
  commentary: string;
  score: number;
}

const TOTAL_QUESTIONS = 5;
const QUESTION_SECONDS = 7;
const PASS_LABEL = 'Pass';

/**
 * Lighting Round Mini-Game
 *
 * Five rapid-fire binary questions about family members.
 * +5 for correct, -5 for wrong, 0 for pass/timeout.
 */
export function LightingRoundUI({
  targetPlayer,
  allPlayers,
  turns,
  intro,
  onComplete,
  onSkip,
}: LightingRoundUIProps) {
  const [phase, setPhase] = useState<LightingRoundPhase>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<LightingRoundQuestionResponse | null>(null);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [feedbackResult, setFeedbackResult] = useState<RoundResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnId, setTurnId] = useState<string | null>(null);
  const [turnStartTime, setTurnStartTime] = useState<number | null>(null);

  const storedTurns = useGameStore((state) => state.turns);
  const storedPlayers = usePlayerStore((state) => state.players);
  const scores = useGameStore((state) => state.scores);
  const addTurn = useGameStore((state) => state.addTurn);
  const completeTurn = useGameStore((state) => state.completeTurn);
  const updatePlayerScore = useGameStore((state) => state.updatePlayerScore);

  const theme = getTheme('lighting_round');
  const allTurns = turns && turns.length > 0 ? turns : storedTurns;
  const promptPlayers = useMemo<MiniGamePlayer[]>(() => {
    if (storedPlayers.length === 0) return allPlayers;
    return storedPlayers.map((player) => ({
      id: player.id,
      name: player.name,
      role: player.role,
      avatar: player.avatar,
      age: player.age,
    }));
  }, [allPlayers, storedPlayers]);
  const promptTargetPlayer = useMemo<MiniGamePlayer>(() => {
    const match = storedPlayers.find((player) => player.id === targetPlayer.id);
    return match
      ? {
          id: match.id,
          name: match.name,
          role: match.role,
          avatar: match.avatar,
          age: match.age,
        }
      : targetPlayer;
  }, [storedPlayers, targetPlayer]);

  const priorLightingQuestions = useMemo<LightingRoundHistoryItem[]>(() => {
    return (allTurns || [])
      .filter((turn) => turn?.templateType === 'lighting_round' && turn.response)
      .flatMap((turn) => {
        const questions = (turn.response as Record<string, any>)?.questions;
        if (!Array.isArray(questions)) return [];

        return questions
          .filter((item) => item && item.question && item.leftText && item.rightText && item.correctChoice)
          .map((item) => ({
            question: item.question,
            leftText: item.leftText,
            rightText: item.rightText,
            correctChoice: item.correctChoice,
            subjectPlayerId: item.subjectPlayerId,
            subjectPlayerName: item.subjectPlayerName,
            playerChoice: item.playerChoice,
            score: item.score,
          })) as LightingRoundHistoryItem[];
      });
  }, [allTurns]);

  const historyForPrompt = useMemo<LightingRoundHistoryItem[]>(() => {
    return roundResults.map((result) => ({
      question: result.question,
      leftText: result.leftText,
      rightText: result.rightText,
      correctChoice: result.correctChoice,
      subjectPlayerId: result.subjectPlayerId,
      subjectPlayerName: result.subjectPlayerName,
      playerChoice: result.playerChoice,
      score: result.score,
    }));
  }, [roundResults]);

  const totalScore = useMemo(
    () => roundResults.reduce((sum, result) => sum + (result.score || 0), 0),
    [roundResults]
  );

  const summaryCommentary = useMemo(() => {
    if (totalScore >= 15) return 'Lightning reflexes. The family is impressed.';
    if (totalScore >= 5) return 'Solid sparks. Room for more thunder.';
    if (totalScore >= 0) return 'You survived the storm. Barely.';
    return 'Ouch. The lightning struck back.';
  }, [totalScore]);

  const generateQuestion = async (roundNumber: number) => {
    setPhase('loading');
    setError(null);

    try {
      const prompt = buildLightingRoundQuestionPrompt({
        targetPlayer: promptTargetPlayer,
        allPlayers: promptPlayers,
        turns: allTurns,
        scores,
        roundIndex: roundNumber,
        totalRounds: TOTAL_QUESTIONS,
        seconds: QUESTION_SECONDS,
        previousQuestions: historyForPrompt,
        priorLightingQuestions,
        allMiniGamesPlayed: getAllMiniGamesPlayed(allTurns),
      });

      const response = await sendChatRequest([
        { role: 'system', content: prompt },
        { role: 'user', content: 'Generate the next Lighting Round question as JSON.' },
      ], {
        toolChoice: 'none',
      });

      const parsed = parseLightingRoundQuestionResponse(response.text);
      if (!parsed) {
        throw new Error('Invalid question response from AI');
      }

      setCurrentQuestion(parsed);
      setPhase('question');

      if (!turnId) {
        const createdTurnId = addTurn({
          playerId: targetPlayer.id,
          playerName: targetPlayer.name,
          templateType: 'lighting_round',
          prompt: `Lighting Round: ${TOTAL_QUESTIONS} rapid questions`,
          templateParams: {
            totalQuestions: TOTAL_QUESTIONS,
            seconds: QUESTION_SECONDS,
            passLabel: PASS_LABEL,
          },
        });
        setTurnId(createdTurnId);
        setTurnStartTime(Date.now());
      }
    } catch (err) {
      console.error('Failed to generate Lighting Round question:', err);
      setError('Failed to generate the next question. Try again.');
      setPhase('error');
    }
  };

  const handleStart = () => {
    setQuestionIndex(0);
    setRoundResults([]);
    setFeedbackResult(null);
    generateQuestion(1);
  };

  const handleAnswer = (response: {
    choice: 'left' | 'right' | 'neither' | null;
    selectedText?: string;
    timeRemaining?: number;
    timedOut: boolean;
  }) => {
    if (!currentQuestion) return;

    const choice = response.choice;
    const isSelection = choice === 'left' || choice === 'right';
    const isCorrect = isSelection ? choice === currentQuestion.correctChoice : null;
    const score = isSelection ? (isCorrect ? 5 : -5) : 0;
    const commentary = isSelection
      ? (isCorrect ? (currentQuestion.commentaryCorrect || 'Nailed it.') : (currentQuestion.commentaryWrong || 'Oof. Not quite.'))
      : (currentQuestion.commentaryPass || 'Pass logged.');

    const roundResult: RoundResult = {
      roundNumber: questionIndex + 1,
      question: currentQuestion.question,
      leftText: currentQuestion.leftText,
      rightText: currentQuestion.rightText,
      correctChoice: currentQuestion.correctChoice,
      subjectPlayerId: currentQuestion.subjectPlayerId,
      subjectPlayerName: currentQuestion.subjectPlayerName,
      playerChoice: choice,
      selectedText: response.selectedText,
      timedOut: response.timedOut,
      isCorrect,
      score,
      commentary,
    };

    setRoundResults((prev) => [...prev, roundResult]);
    setFeedbackResult(roundResult);
    setPhase('feedback');
  };

  const handleNext = () => {
    const nextIndex = questionIndex + 1;

    if (nextIndex >= TOTAL_QUESTIONS) {
      setPhase('result');
      return;
    }

    setQuestionIndex(nextIndex);
    setCurrentQuestion(null);
    setFeedbackResult(null);
    generateQuestion(nextIndex + 1);
  };

  const handleComplete = () => {
    const correctCount = roundResults.filter((result) => result.score > 0).length;
    const wrongCount = roundResults.filter((result) => result.score < 0).length;
    const passCount = roundResults.filter((result) => result.score === 0).length;

    if (turnId) {
      const duration = turnStartTime ? (Date.now() - turnStartTime) / 1000 : undefined;
      completeTurn(
        turnId,
        {
          totalScore,
          maxScore: TOTAL_QUESTIONS * 5,
          correctCount,
          wrongCount,
          passCount,
          questions: roundResults.map((result) => ({
            question: result.question,
            leftText: result.leftText,
            rightText: result.rightText,
            correctChoice: result.correctChoice,
            subjectPlayerId: result.subjectPlayerId,
            subjectPlayerName: result.subjectPlayerName,
            playerChoice: result.playerChoice,
            selectedText: result.selectedText,
            timedOut: result.timedOut,
            score: result.score,
            commentary: result.commentary,
          })),
        },
        duration
      );
    }

    updatePlayerScore(targetPlayer.id, totalScore);
    onComplete({
      score: totalScore,
      maxScore: TOTAL_QUESTIONS * 5,
      commentary: summaryCommentary,
    });
  };

  if (phase === 'intro') {
    const introText = intro || 'Five rapid-fire family questions.';
    const description = `${introText} +5 right, -5 wrong, 0 pass.`;
    return (
      <IntroScreen
        theme={theme}
        title="Lighting Round"
        description={description}
        iconImage={lightingRoundIcon}
        onStart={handleStart}
        onSkip={onSkip}
        startButtonText="Start the Round"
      />
    );
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-0 flex-1 flex items-center justify-center p-6">
        <LoadingSpinner
          color={theme.primary}
          message={`Loading question ${questionIndex + 1} of ${TOTAL_QUESTIONS}...`}
        />
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="min-h-0 flex-1 flex items-center justify-center p-6">
        <div className="glass rounded-xl p-6 border border-alert max-w-md w-full text-center space-y-4">
          <h2 className="text-alert font-bold text-xl">Something went wrong</h2>
          <p className="text-frost text-sm">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => generateQuestion(questionIndex + 1)}
              className="flex-1 bg-glitch hover:bg-glitch-bright text-frost font-bold py-3 px-4 rounded-xl transition-colors"
            >
              Retry
            </button>
            {onSkip && (
              <button
                onClick={onSkip}
                className="flex-1 bg-steel-800 hover:bg-steel-700 text-frost font-bold py-3 px-4 rounded-xl transition-colors"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'question' && currentQuestion) {
    return (
      <div className="min-h-0 flex-1 flex flex-col">
        <TimedBinaryTemplate
          key={`${questionIndex}-${currentQuestion.question}`}
          prompt={currentQuestion.question}
          subtitle={`Question ${questionIndex + 1} of ${TOTAL_QUESTIONS}`}
          leftText={currentQuestion.leftText}
          rightText={currentQuestion.rightText}
          seconds={QUESTION_SECONDS}
          orientation="vertical"
          neitherLabel={PASS_LABEL}
          onSubmit={handleAnswer}
        />
      </div>
    );
  }

  if (phase === 'feedback' && feedbackResult) {
    const correctText = feedbackResult.correctChoice === 'left'
      ? feedbackResult.leftText
      : feedbackResult.rightText;
    const isPass = feedbackResult.score === 0;
    const scoreLabel = isPass ? '0' : feedbackResult.score > 0 ? '+5' : '-5';
    const title = feedbackResult.timedOut
      ? 'Time!'
      : isPass
      ? 'Pass'
      : feedbackResult.score > 0
      ? 'Correct!'
      : 'Wrong!';

    return (
      <div className="min-h-0 flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5">
        <p className="text-steel-500 font-mono text-xs uppercase tracking-widest">
          Question {feedbackResult.roundNumber} of {TOTAL_QUESTIONS}
        </p>
        <motion.h2
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-3xl md:text-4xl font-black text-frost"
        >
          {title}
        </motion.h2>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`text-5xl font-black ${feedbackResult.score > 0 ? 'text-mint' : feedbackResult.score < 0 ? 'text-alert' : 'text-steel-400'}`}
        >
          {scoreLabel}
        </motion.div>
        <CommentaryCard
          commentary={feedbackResult.commentary}
          emoji={feedbackResult.score > 0 ? theme.emoji : feedbackResult.score < 0 ? '!' : '...'}
        />
        <div className="glass rounded-xl p-4 border border-steel-800 text-steel-300 text-sm">
          Correct answer: <span className="text-frost font-semibold">{correctText}</span>
        </div>
        <button
          onClick={handleNext}
          className="w-full bg-glitch hover:bg-glitch-bright text-frost font-bold py-3 px-6 rounded-xl transition-all"
        >
          {feedbackResult.roundNumber >= TOTAL_QUESTIONS ? 'See Results' : 'Next Question'}
        </button>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="min-h-0 flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-black text-frost">Lighting Round Results</h2>
        <ScoreDisplay score={totalScore} maxScore={TOTAL_QUESTIONS * 5} colorScheme="glitch" />
        <CommentaryCard commentary={summaryCommentary} emoji={theme.emoji} />
        <button
          onClick={handleComplete}
          className="w-full bg-glitch hover:bg-glitch-bright text-frost font-bold py-3 px-6 rounded-xl transition-all"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 flex items-center justify-center p-6">
      <ErrorToast error={error} onRetry={() => generateQuestion(questionIndex + 1)} />
    </div>
  );
}
