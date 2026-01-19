/**
 * Usage Examples for Input Templates
 *
 * This file demonstrates how to integrate the input templates
 * with the game flow and AI system.
 */

'use client';

import { useState } from 'react';
import { TemplateRenderer } from './index';
import { useGameStore, usePlayerStore } from '@/lib/store';
import type { TemplateType } from '@/lib/types/template-params';

/**
 * Example 1: Basic Template Usage
 * Simple static template rendering
 */
export function BasicTemplateExample() {
  const handleSubmit = (response: any) => {
    console.log('User submitted:', response);
  };

  return (
    <TemplateRenderer
      templateType="tpl_text_area"
      params={{
        prompt: "What's your favorite childhood memory?",
        subtitle: "Be specific and detailed",
        maxLength: 300,
        onSubmit: handleSubmit,
      }}
    />
  );
}

/**
 * Example 2: Dynamic Template with Game State Integration
 * Shows how to integrate templates with the game store
 */
export function GameIntegratedTemplate() {
  const { addTurn, completeTurn, getCurrentTurn } = useGameStore();
  const { players } = usePlayerStore();
  const [currentTurn, setCurrentTurn] = useState(getCurrentTurn());

  if (!currentTurn) {
    return <div>No active turn</div>;
  }

  const handleSubmit = (response: any) => {
    const duration = Date.now() - new Date(currentTurn.timestamp).getTime();

    // Store the response in game state
    completeTurn(currentTurn.turnId, response, duration / 1000);

    // Move to next turn or show results
    console.log('Turn completed!', response);
  };

  return (
    <TemplateRenderer
      templateType={currentTurn.templateType as TemplateType}
      params={{
        prompt: currentTurn.prompt,
        ...currentTurn.templateParams,
        // Inject player data for player selector template
        ...(currentTurn.templateType === 'tpl_player_selector' && {
          players: players,
          currentPlayerId: players[0]?.id || '',
        }),
        onSubmit: handleSubmit,
      }}
    />
  );
}

/**
 * Example 3: AI-Driven Template Selection
 * Shows how AI would select and configure templates
 */
export function AIDrivenTemplateExample() {
  const { addTurn } = useGameStore();
  const { players } = usePlayerStore();

  // Simulating AI response that determines the template
  const aiDecision = {
    templateType: 'tpl_timed_binary' as TemplateType,
    prompt: 'Quick! Pizza or Tacos?',
    params: {
      leftText: 'Pizza 🍕',
      rightText: 'Tacos 🌮',
      seconds: 5,
    },
  };

  // Create the turn in game state
  const createTurn = () => {
    addTurn({
      playerId: players[0]?.id || 'unknown',
      playerName: players[0]?.name || 'Player',
      templateType: aiDecision.templateType,
      prompt: aiDecision.prompt,
      templateParams: aiDecision.params,
    });
  };

  const handleSubmit = (response: any) => {
    console.log('AI will analyze:', response);
    // Send response back to AI for commentary
  };

  return (
    <TemplateRenderer
      templateType={aiDecision.templateType}
      params={{
        prompt: aiDecision.prompt,
        ...aiDecision.params,
        onSubmit: handleSubmit,
      }}
    />
  );
}

/**
 * Example 4: Player Selector with Real Players
 * Shows how to pass current players into the template
 */
export function PlayerSelectorExample() {
  const { players } = usePlayerStore();
  const currentPlayerId = players[0]?.id || '';

  const handleSubmit = (response: any) => {
    console.log('Player voted for:', response.selectedPlayers);
  };

  return (
    <TemplateRenderer
      templateType="tpl_player_selector"
      params={{
        prompt: "Who's most likely to survive a zombie apocalypse?",
        players: players.map((p) => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
        })),
        currentPlayerId,
        allowMultiple: false,
        onSubmit: handleSubmit,
      }}
    />
  );
}

/**
 * Example 5: Complete Turn Flow
 * Shows a full turn including setup, render, and completion
 */
export function CompleteTurnFlowExample() {
  const { addTurn, completeTurn, updatePlayerScore } = useGameStore();
  const { players } = usePlayerStore();
  const [activeTurn, setActiveTurn] = useState<any>(null);

  const startNewTurn = (playerId: string) => {
    // AI determines what template to use
    const aiChoice = {
      templateType: 'tpl_word_grid' as TemplateType,
      prompt: 'Select words that describe your mood',
      params: {
        words: [
          'Happy',
          'Anxious',
          'Excited',
          'Tired',
          'Hungry',
          'Focused',
          'Bored',
          'Energized',
          'Stressed',
        ],
        gridSize: 9,
        selectionMode: 'multiple',
        minSelections: 1,
        maxSelections: 3,
      },
    };

    const player = players.find((p) => p.id === playerId);
    if (!player) return;

    // Add turn to game state
    addTurn({
      playerId: player.id,
      playerName: player.name,
      templateType: aiChoice.templateType,
      prompt: aiChoice.prompt,
      templateParams: aiChoice.params,
    });

    // Set as active turn for rendering
    setActiveTurn({
      templateType: aiChoice.templateType,
      prompt: aiChoice.prompt,
      params: aiChoice.params,
    });
  };

  const handleTurnComplete = (turnId: string, response: any) => {
    const duration = 10; // Calculate actual duration

    // Store response
    completeTurn(turnId, response, duration);

    // Award points (AI could determine this)
    updatePlayerScore(players[0].id, 10);

    // Clear active turn
    setActiveTurn(null);

    console.log('Turn complete! Moving to next player...');
  };

  if (!activeTurn) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <button
          onClick={() => startNewTurn(players[0]?.id)}
          className="px-6 py-3 bg-glitch text-frost rounded-xl"
        >
          Start Turn
        </button>
      </div>
    );
  }

  return (
    <TemplateRenderer
      templateType={activeTurn.templateType}
      params={{
        prompt: activeTurn.prompt,
        ...activeTurn.params,
        onSubmit: (response) => handleTurnComplete('current-turn-id', response),
      }}
    />
  );
}

/**
 * Example 6: All Templates Demo
 * Cycles through all available templates for testing
 */
export function AllTemplatesDemo() {
  const [templateIndex, setTemplateIndex] = useState(0);
  const { players } = usePlayerStore();

  const templates = [
    {
      type: 'tpl_text_area' as TemplateType,
      params: {
        prompt: "What's your biggest fear?",
        maxLength: 200,
        onSubmit: (r: any) => console.log('Text Area:', r),
      },
    },
    {
      type: 'tpl_text_input' as TemplateType,
      params: {
        prompt: 'Name 3 things in your pocket',
        fieldCount: 3,
        onSubmit: (r: any) => console.log('Text Input:', r),
      },
    },
    {
      type: 'tpl_timed_binary' as TemplateType,
      params: {
        prompt: 'Quick decision!',
        leftText: 'Pizza',
        rightText: 'Tacos',
        seconds: 10,
        onSubmit: (r: any) => console.log('Timed Binary:', r),
      },
    },
    {
      type: 'tpl_word_grid' as TemplateType,
      params: {
        prompt: 'Select words that describe you',
        words: ['Happy', 'Sarcastic', 'Introverted', 'Creative', 'Analytical', 'Empathetic', 'Competitive', 'Chill', 'Intense'],
        gridSize: 9,
        selectionMode: 'multiple',
        maxSelections: 3,
        onSubmit: (r: any) => console.log('Word Grid:', r),
      },
    },
    {
      type: 'tpl_slider' as TemplateType,
      params: {
        prompt: 'How hungry are you?',
        min: 0,
        max: 10,
        minLabel: 'Not hungry',
        maxLabel: 'Starving',
        onSubmit: (r: any) => console.log('Slider:', r),
      },
    },
    {
      type: 'tpl_player_selector' as TemplateType,
      params: {
        prompt: "Who's the best cook?",
        players: players.map((p) => ({ id: p.id, name: p.name, avatar: p.avatar })),
        currentPlayerId: players[0]?.id || '',
        onSubmit: (r: any) => console.log('Player Selector:', r),
      },
    },
  ];

  const nextTemplate = () => {
    setTemplateIndex((prev) => (prev + 1) % templates.length);
  };

  return (
    <div className="relative">
      <TemplateRenderer
        templateType={templates[templateIndex].type}
        params={templates[templateIndex].params}
      />
      <button
        onClick={nextTemplate}
        className="fixed bottom-4 right-4 px-4 py-2 bg-glitch text-frost rounded-lg"
      >
        Next Template ({templateIndex + 1}/{templates.length})
      </button>
    </div>
  );
}
