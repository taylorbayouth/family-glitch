/**
 * Cryptic Connection Registration
 *
 * Registers the Cryptic Connection mini-game with the central registry.
 */

import type { ComponentType } from 'react';
import { CrypticConnectionUI } from '@/components/mini-games/CrypticConnectionUI';
import { registerMiniGame, type MiniGameConfig, type BaseMiniGameProps } from '../registry';

// Cryptic Connection has no special config - AI generates everything
export interface CrypticConnectionConfig extends MiniGameConfig {
  // No additional config needed - AI generates puzzle on the fly
}

registerMiniGame<CrypticConnectionConfig>({
  type: 'cryptic_connection',
  name: 'Cryptic Connection',

  component: CrypticConnectionUI as ComponentType<BaseMiniGameProps & CrypticConnectionConfig>,

  extractConfig: () => {
    // Cryptic Connection always works - no special setup needed
    // The component itself calls the AI to generate the puzzle
    return {};
  },

  // No special turn data needed
});
