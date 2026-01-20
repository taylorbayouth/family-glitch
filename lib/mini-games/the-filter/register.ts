/**
 * The Filter Registration
 *
 * Registers The Filter mini-game with the central registry.
 */

import type { ComponentType } from 'react';
import { TheFilterUI } from '@/components/mini-games/TheFilterUI';
import { registerMiniGame, type MiniGameConfig, type BaseMiniGameProps } from '../registry';

// Config specific to The Filter
export interface FilterConfig extends MiniGameConfig {}

registerMiniGame<FilterConfig>({
  type: 'the_filter',
  name: 'The Filter',

  component: TheFilterUI as ComponentType<BaseMiniGameProps & FilterConfig>,

  extractConfig: (templateConfig, context) => {
    // The Filter doesn't need any special config from the template
    // It generates everything internally via AI
    return {};
  },

  getTurnData: (config) => ({
    // No special turn data needed
  }),
});
