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
        const response = await fetch('/api/turn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameState,
            userInput,
            inputType,
          }),
        });

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
        }

        // Update challenge
        if (data.challenge) {
          setCurrentChallengeLocal(data.challenge);
          setChallenge(data.challenge);
          if (data.challenge.context) {
            const miniGame = data.challenge.context.toUpperCase().replace(' ', '_');
            if (['HIVE_MIND', 'LETTER_CHAOS', 'VENTRILOQUIST', 'WAGER', 'TRIBUNAL'].includes(miniGame)) {
              setCurrentMiniGame(miniGame as typeof gameState.meta.currentMiniGame);
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
        if (data.nextPhase) {
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
    [gameState, setLoading, setAIResponse, updateScore, addHistory, addShadowData, setChallenge, setCurrentMiniGame]
  );

  const getNextPlayer = useCallback(() => {
    const currentIndex = playerNames.indexOf(gameState.meta.currentPlayer);
    const nextIndex = (currentIndex + 1) % playerNames.length;
    return playerNames[nextIndex];
  }, [playerNames, gameState.meta.currentPlayer]);

  const handleSetupStart = useCallback(async () => {
    setPhase('SETUP');
    await callAI();
  }, [setPhase, callAI]);

  const handleSetupComplete = useCallback(() => {
    // Move to first handoff
    const firstPlayer = playerNames[0];
    setCurrentPlayer(firstPlayer);
    nextTurn();
    setPhase('HANDOFF');
    setCurrentDisplay({
      title: 'Game Starting!',
      message: `Pass the phone to ${firstPlayer}`,
    });
  }, [playerNames, setCurrentPlayer, nextTurn, setPhase]);

  const handleHandoffReady = useCallback(async () => {
    // After handoff, go to shadow phase
    setPhase('SHADOW');
    await callAI();
  }, [setPhase, callAI]);

  const handleShadowSubmit = useCallback(
    async (value: string) => {
      // Determine shadow type based on prompt
      let shadowType: 'adjectives' | 'verbs' | 'nouns' | 'observations' = 'observations';
      const promptLower = shadowPrompt.toLowerCase();
      if (promptLower.includes('adjective')) shadowType = 'adjectives';
      else if (promptLower.includes('verb')) shadowType = 'verbs';
      else if (promptLower.includes('noun')) shadowType = 'nouns';

      addShadowData(shadowType, value);

      // Move to play phase
      setPhase('PLAY');
      setCurrentChallengeLocal(null);
      await callAI();
    },
    [shadowPrompt, addShadowData, setPhase, callAI]
  );

  const handlePlaySubmit = useCallback(
    async (value: string, type: string) => {
      // Submit answer and move to judgment
      setPhase('JUDGMENT');
      await callAI(value, type);
    },
    [setPhase, callAI]
  );

  const handleJudgmentContinue = useCallback(() => {
    // Check if game should end
    if (gameState.meta.turn >= gameState.meta.maxTurns) {
      setPhase('FINALE');
      callAI();
    } else {
      // Move to next player's handoff
      const nextPlayer = getNextPlayer();
      setCurrentPlayer(nextPlayer);
      nextTurn();
      setPhase('HANDOFF');
      setCurrentDisplay({
        title: 'Next Up!',
        message: `Pass the phone to ${nextPlayer}`,
      });
    }
  }, [gameState.meta.turn, gameState.meta.maxTurns, getNextPlayer, setCurrentPlayer, nextTurn, setPhase, callAI]);

  const handlePlayAgain = useCallback(() => {
    resetGame();
    setCurrentDisplay(null);
    setCurrentChallengeLocal(null);
    setShadowPrompt('');
  }, [resetGame]);

  // Handle pending phase transitions after display updates
  useEffect(() => {
    if (pendingPhase && !isLoading) {
      if (pendingPhase === 'SHADOW' && currentDisplay?.message) {
        // Extract shadow prompt from display
        setShadowPrompt(currentDisplay.message);
      }
      setPhase(pendingPhase);
      setPendingPhase(null);
    }
  }, [pendingPhase, isLoading, currentDisplay, setPhase]);

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
