'use client';

import { useGameStore } from '@/lib/gameStore-v2';
import { SetupScreen } from '@/components/v2/SetupScreen';
import { GameOrchestrator } from '@/components/v2/GameOrchestrator';
import { FinaleScreen } from '@/components/v2/FinaleScreen';

export default function GameV2Page() {
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
