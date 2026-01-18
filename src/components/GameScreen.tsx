'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/gameStore';
import { SetupPhase } from './SetupPhase';
import { HandoffScreen } from './HandoffScreen';
import { ShadowPhase } from './ShadowPhase';
import { PlayPhase } from './PlayPhase';
import { JudgmentPhase } from './JudgmentPhase';
import { FinalePhase } from './FinalePhase';
import { GlitchLoader } from './GlitchLoader';
import type { Challenge, GamePhase } from '@/types/game';

export function GameScreen() {
  const {
    gameState,
    isLoading,
    lastAIResponse,
    setLoading,
    setPhase,
    setCurrentPlayer,
    setAIResponse,
    updateScore,
    addShadowData,
    addHistory,
    nextTurn,
    resetGame,
    setChallenge,
    setCurrentMiniGame,
    addPendingAnswer,
    clearPendingAnswers,
  } = useGameStore();

  const [currentDisplay, setCurrentDisplay] = useState<{
    title: string;
    message: string;
    subtext?: string;
  } | null>(null);
  const [currentChallenge, setCurrentChallengeLocal] = useState<Challenge | null>(
    null
  );
  const [shadowPrompt, setShadowPrompt] = useState<string>('');
  const [pendingPhase, setPendingPhase] = useState<GamePhase | null>(null);

  const playerNames = Object.keys(gameState.players);

  const callAI = useCallback(
    async (userInput?: string, inputType?: string) => {
      setLoading(true);
      try {
        const { gameState: latestGameState } = useGameStore.getState();
        const response = await fetch('/api/turn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameState: latestGameState,
            userInput,
            inputType,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          console.error('AI Error:', text);
          setCurrentDisplay({
            title: 'Glitch Error!',
            message: 'The Glitch hit interference. Tap to retry.',
          });
          return;
        }

        const data = await response.json();

        if (data.error) {
          console.error('AI Error:', data.error);
          setCurrentDisplay(data.display);
          return;
        }

        // Store the AI response
        setAIResponse({
          display: data.display,
          scoreUpdates: data.scoreUpdates,
          poem: data.poem,
        });

        // Update display
        if (data.display) {
          setCurrentDisplay(data.display);
          if (latestGameState.meta.phase === 'SHADOW') {
            setShadowPrompt(data.display.message);
          }
        }

        // Update challenge
        if (data.challenge) {
          setCurrentChallengeLocal(data.challenge);
          setChallenge(data.challenge);
          if (data.challenge.context) {
            const miniGame = data.challenge.context.toUpperCase().replace(' ', '_');
            if (['HIVE_MIND', 'LETTER_CHAOS', 'VENTRILOQUIST', 'WAGER', 'TRIBUNAL'].includes(miniGame)) {
              setCurrentMiniGame(miniGame as typeof latestGameState.meta.currentMiniGame);
            }
          }
        }

        // Apply score updates
        if (data.scoreUpdates) {
          data.scoreUpdates.forEach((update: { player: string; points: number; reason: string }) => {
            updateScore(update.player, update.points);
          });
        }

        // Apply game state updates
        if (data.gameStateUpdates) {
          if (data.gameStateUpdates.history) {
            data.gameStateUpdates.history.forEach((entry: string) => {
              addHistory(entry);
            });
          }
          if (data.gameStateUpdates.shadowData) {
            Object.entries(data.gameStateUpdates.shadowData).forEach(([key, values]) => {
              (values as string[]).forEach((value: string) => {
                addShadowData(key as 'adjectives' | 'verbs' | 'nouns' | 'observations', value);
              });
            });
          }
        }

        // Handle phase transition
        const shouldQueuePhase = !(latestGameState.meta.phase === 'HANDOFF' || (latestGameState.meta.phase === 'SHADOW' && !userInput));
        if (data.nextPhase && shouldQueuePhase) {
          setPendingPhase(data.nextPhase);
        } else if (data.nextPhase && latestGameState.meta.phase === 'HANDOFF') {
          // Keep pending for manual advance
          setPendingPhase(data.nextPhase);
        }
      } catch (error) {
        console.error('API call failed:', error);
        setCurrentDisplay({
          title: 'Connection Lost!',
          message: 'The Glitch encountered interference. Tap to retry.',
        });
      } finally {
        setLoading(false);
      }
    },
    [addHistory, addShadowData, setAIResponse, setChallenge, setCurrentMiniGame, setLoading, updateScore]
  );

  const getNextPlayer = useCallback(() => {
    const currentIndex = playerNames.indexOf(gameState.meta.currentPlayer);
    const nextIndex = (currentIndex + 1) % playerNames.length;
    return playerNames[nextIndex];
  }, [playerNames, gameState.meta.currentPlayer]);

  const handleSetupStart = useCallback(async () => {
    const currentPlayers = Object.keys(useGameStore.getState().gameState.players);
    const firstPlayer = currentPlayers[0] || '';
    setCurrentPlayer(firstPlayer);
    nextTurn();
    setPhase('HANDOFF');
    await callAI();
  }, [setCurrentPlayer, nextTurn, setPhase, callAI]);

  const handleHandoffReady = useCallback(async () => {
    const nextPhase = pendingPhase || 'SHADOW';
    setPendingPhase(null);
    setPhase(nextPhase);
    await callAI();
  }, [pendingPhase, setPhase, callAI]);

  const handleShadowSubmit = useCallback(
    async (value: string) => {
      // Determine shadow type based on prompt
      let shadowType: 'adjectives' | 'verbs' | 'nouns' | 'observations' = 'observations';
      const promptLower = shadowPrompt.toLowerCase();
      if (promptLower.includes('adjective')) shadowType = 'adjectives';
      else if (promptLower.includes('verb')) shadowType = 'verbs';
      else if (promptLower.includes('noun')) shadowType = 'nouns';

      addShadowData(shadowType, value);
      setCurrentChallengeLocal(null);
      await callAI(value, shadowType);
    },
    [shadowPrompt, addShadowData, callAI]
  );

  const handlePlaySubmit = useCallback(
    async (value: string, type: string) => {
      if (type === 'group') {
        clearPendingAnswers();
        try {
          const answers = JSON.parse(value) as Record<string, string>;
          Object.entries(answers).forEach(([player, answer]) => {
            if (answer.trim()) {
              addPendingAnswer(player, answer.trim());
            }
          });
        } catch (e) {
          console.error('Failed to parse group answers', e);
        }
      }
      await callAI(value, type);
    },
    [callAI, addPendingAnswer, clearPendingAnswers]
  );

  const handleJudgmentContinue = useCallback(async () => {
    clearPendingAnswers();
    const targetPhase = pendingPhase || (gameState.meta.turn >= gameState.meta.maxTurns ? 'FINALE' : 'HANDOFF');

    if (targetPhase === 'FINALE') {
      setPhase('FINALE');
      await callAI();
      setPendingPhase(null);
      return;
    }

    const nextPlayer = getNextPlayer();
    setCurrentPlayer(nextPlayer);
    nextTurn();
    setCurrentChallengeLocal(null);
    setChallenge(null);
    setPendingPhase(null);
    setPhase('HANDOFF');
    setCurrentDisplay(null);
    await callAI();
  }, [pendingPhase, gameState.meta.turn, gameState.meta.maxTurns, getNextPlayer, setCurrentPlayer, nextTurn, setPhase, callAI, clearPendingAnswers, setChallenge]);

  const handlePlayAgain = useCallback(() => {
    resetGame();
    setCurrentDisplay(null);
    setCurrentChallengeLocal(null);
    setShadowPrompt('');
  }, [resetGame]);

  // Handle pending phase transitions after display updates
  useEffect(() => {
    if (pendingPhase && !isLoading) {
      const phase = gameState.meta.phase;
      if (phase === 'HANDOFF' || phase === 'JUDGMENT') return;
      if (pendingPhase === 'SHADOW' && currentDisplay?.message) {
        setShadowPrompt(currentDisplay.message);
      }
      setPhase(pendingPhase);
      setPendingPhase(null);
    }
  }, [pendingPhase, isLoading, currentDisplay, setPhase, gameState.meta.phase]);

  // If we enter PLAY without a challenge, ask the AI for one
  useEffect(() => {
    if (gameState.meta.phase === 'PLAY' && !currentChallenge && !isLoading) {
      callAI();
    }
  }, [gameState.meta.phase, currentChallenge, isLoading, callAI]);

  // Loading screen
  if (isLoading) {
    return <GlitchLoader />;
  }

  const phase = gameState.meta.phase;

  return (
    <AnimatePresence mode="wait">
      {phase === 'SETUP' && (
        <SetupPhase key="setup" onStart={handleSetupStart} />
      )}

      {phase === 'HANDOFF' && (
        <HandoffScreen
          key="handoff"
          playerName={gameState.meta.currentPlayer}
          message={currentDisplay?.subtext}
          onReady={handleHandoffReady}
        />
      )}

      {phase === 'SHADOW' && (
        <ShadowPhase
          key="shadow"
          prompt={currentDisplay?.message || shadowPrompt || 'Give me a word!'}
          onSubmit={handleShadowSubmit}
        />
      )}

      {phase === 'PLAY' && (
        <PlayPhase
          key="play"
          title={currentDisplay?.title || 'Challenge Time'}
          message={currentDisplay?.message || 'Loading...'}
          subtext={currentDisplay?.subtext}
          challenge={currentChallenge || undefined}
          players={playerNames}
          onSubmit={handlePlaySubmit}
        />
      )}

      {phase === 'JUDGMENT' && (
        <JudgmentPhase
          key="judgment"
          title={currentDisplay?.title || 'Judgment'}
          message={currentDisplay?.message || 'Evaluating...'}
          scoreUpdates={lastAIResponse?.scoreUpdates}
          onContinue={handleJudgmentContinue}
        />
      )}

      {phase === 'FINALE' && (
        <FinalePhase
          key="finale"
          poem={lastAIResponse?.poem || 'The Glitch has spoken...'}
          players={gameState.players}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </AnimatePresence>
  );
}
