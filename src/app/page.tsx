'use client';

import { useGameStore } from '@/lib/gameStore';
import { SetupScreen } from '@/components/SetupScreen';
import { GameOrchestrator } from '@/components/GameOrchestrator';
import { FinaleScreen } from '@/components/FinaleScreen';

export default function GamePage() {
  const { gameState, resetGame, lastAIResponse } = useGameStore();

  const phase = gameState.meta.phase;

  // Setup phase - no players yet
  if (phase === 'SETUP') {
    return <SetupScreen />;
  }

  // Finale phase - game complete
  if (phase === 'FINALE') {
    return (
      <FinaleScreen
        finale={(lastAIResponse as any)?.finale}
        onPlayAgain={resetGame}
      />
    );
  }

  // Active game - orchestrate the interfaces
  return <GameOrchestrator />;
}
