'use client';

import { useCallback, useEffect } from 'react';
import { useGameStore } from '@/lib/gameStore-v2';
import { TheSecretConfessional } from './TheSecretConfessional';
import { TheHandoff } from './TheHandoff';
import { TheGallery } from './TheGallery';
import { TheSelector } from './TheSelector';
import { ScoreReveal } from './ScoreReveal';
import { GlitchLoader } from '../GlitchLoader';

export function GameOrchestrator() {
  const {
    gameState,
    isLoading,
    currentInterface,
    lastAIResponse,
    setLoading,
    setPhase,
    nextPlayer,
    nextTurn,
    getCurrentPlayer,
  } = useGameStore();

  const callAI = useCallback(
    async (userInput?: string | string[], inputType?: string) => {
      setLoading(true);
      try {
        const response = await fetch('/api/turn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            game_state: gameState,
            user_input: userInput,
            input_type: inputType,
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          console.error('AI Error:', text);
          // TODO: Show error state
          return;
        }

        const data = await response.json();

        // Apply AI response to store
        useGameStore.getState().applyAIResponse(data);
      } catch (error) {
        console.error('API call failed:', error);
        // TODO: Show error state
      } finally {
        setLoading(false);
      }
    },
    [gameState, setLoading]
  );

  // Handle phase-specific auto-calls
  useEffect(() => {
    const phase = gameState.meta.phase;

    // Auto-call AI when entering certain phases
    if (phase === 'PASS_SCREEN' && !isLoading && !currentInterface) {
      callAI();
    }
  }, [gameState.meta.phase, isLoading, currentInterface, callAI]);

  // Handlers for each interface type
  const handleConfessionalSubmit = useCallback(
    (value: string) => {
      callAI(value, 'text');
    },
    [callAI]
  );

  const handleHandoffUnlock = useCallback(() => {
    // Move to the next phase (usually DATA_TAX or MINI_GAME)
    callAI();
  }, [callAI]);

  const handleGallerySubmit = useCallback(
    (value: string) => {
      callAI(value, 'text');
    },
    [callAI]
  );

  const handleSelectorSubmit = useCallback(
    (value: string | string[]) => {
      callAI(value, Array.isArray(value) ? 'multi_select' : 'choice');
    },
    [callAI]
  );

  const handleScoreContinue = useCallback(() => {
    const { turn_count, max_turns } = gameState.meta;

    // Check if game should end
    if (turn_count >= max_turns) {
      setPhase('FINALE');
      callAI();
    } else {
      // Advance to next player
      nextPlayer();
      nextTurn();
      setPhase('PASS_SCREEN');
      callAI();
    }
  }, [gameState.meta, setPhase, nextPlayer, nextTurn, callAI]);

  // Loading state
  if (isLoading) {
    return <GlitchLoader />;
  }

  // Show scoring screen if we have a score event
  if (gameState.meta.phase === 'SCORING' && lastAIResponse?.score_event) {
    const currentPlayer = getCurrentPlayer();
    if (!currentPlayer) return <GlitchLoader />;

    return (
      <ScoreReveal
        scoreEvent={lastAIResponse.score_event}
        playerName={currentPlayer.name}
        playerAvatar={currentPlayer.avatar}
        onContinue={handleScoreContinue}
      />
    );
  }

  // Route to appropriate interface
  if (!currentInterface) {
    return <GlitchLoader />;
  }

  switch (currentInterface.type) {
    case 'THE_SECRET_CONFESSIONAL':
      return (
        <TheSecretConfessional
          data={currentInterface.data as any}
          onSubmit={handleConfessionalSubmit}
        />
      );

    case 'THE_HANDOFF':
      return (
        <TheHandoff
          data={currentInterface.data as any}
          onUnlock={handleHandoffUnlock}
        />
      );

    case 'THE_GALLERY':
      return (
        <TheGallery
          data={currentInterface.data as any}
          onSubmit={handleGallerySubmit}
        />
      );

    case 'THE_SELECTOR':
      return (
        <TheSelector
          data={currentInterface.data as any}
          onSubmit={handleSelectorSubmit}
        />
      );

    default:
      return <GlitchLoader />;
  }
}
