/**
 * Lighting Round - Self Registration
 */

import type { ComponentType } from 'react';
import { registerMiniGame, type BaseMiniGameProps } from '../registry';
import { LightingRoundUI, type LightingRoundConfig } from '@/components/mini-games/LightingRoundUI';

registerMiniGame<LightingRoundConfig>({
  type: 'lighting_round',
  name: 'Lighting Round',
  component: LightingRoundUI as ComponentType<BaseMiniGameProps & LightingRoundConfig>,
  extractConfig: (templateConfig, context) => {
    return {
      intro: (templateConfig.params?.intro as string | undefined) || 'Lighting Round incoming!',
      turns: context.turns || [],
    };
  },
});
