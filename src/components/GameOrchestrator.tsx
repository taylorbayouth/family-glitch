'use client';

import { useCallback, useEffect } from 'react';
import { useGameStore } from '@/lib/gameStore';
import { TheSecretConfessional } from './TheSecretConfessional';
import { TheHandoff } from './TheHandoff';
import { TheGallery } from './TheGallery';
import { TheSelector } from './TheSelector';
import { TheRatingScreen } from './TheRatingScreen';
import { GlitchLoader } from './GlitchLoader';
import type { RatingDimension } from '@/types/game';

export function GameOrchestrator() {
  const {
    gameState,
    isLoading,
    currentInterface,
    setLoading,
  } = useGameStore();

  const callAI = useCallback(
    async (userInput?: string | string[] | Record<string, number>, inputType?: string) => {
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

  // Handle auto-calls when needed
  useEffect(() => {
    // Auto-call AI when we're in PLAYING phase but have no interface
    if (gameState.meta.phase === 'PLAYING' && !isLoading && !currentInterface) {
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

  const handleRatingSubmit = useCallback(
    (ratings: Record<RatingDimension, number>) => {
      callAI(ratings, 'rating');
    },
    [callAI]
  );

  // Loading state
  if (isLoading) {
    return <GlitchLoader />;
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

    case 'THE_RATING_SCREEN':
      return (
        <TheRatingScreen
          data={currentInterface.data as any}
          onSubmit={handleRatingSubmit}
        />
      );

    case 'THE_IMAGE_GENERATOR':
      // TODO: Implement image display with DALL-E integration
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-cyan-400 text-xl mb-4">Image Generator</p>
            <p className="text-gray-400 mb-8">Coming soon - DALL-E integration needed</p>
            <button
              onClick={() => callAI('placeholder', 'text')}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg"
            >
              Continue
            </button>
          </div>
        </div>
      );

    default:
      return <GlitchLoader />;
  }
}
