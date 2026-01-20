/**
 * Hard Trivia Challenge - Self Registration
 */

import type { ComponentType } from 'react';
import { registerMiniGame, type BaseMiniGameProps } from '../registry';
import { HardTriviaUI, type HardTriviaConfig } from '@/components/mini-games/HardTriviaUI';

// Register this mini-game with the global registry
registerMiniGame<HardTriviaConfig>({
  type: 'hard_trivia',
  name: 'Hard Trivia',
  component: HardTriviaUI as ComponentType<BaseMiniGameProps & HardTriviaConfig>,
  extractConfig: (templateConfig, context) => {
    // Hard Trivia can use turns for context but doesn't strictly require them
    return {
      turns: context.turns || [],
    };
  },
});
