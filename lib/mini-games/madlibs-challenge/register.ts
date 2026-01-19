/**
 * Mad Libs Challenge Registration
 *
 * Registers the Mad Libs mini-game with the central registry.
 */

import { MadLibsUI } from '@/components/mini-games/MadLibsUI';
import { registerMiniGame, type MiniGameConfig } from '../registry';

// Mad Libs has no special config - it generates everything itself
export interface MadLibsConfig extends MiniGameConfig {
  // No additional config needed - AI generates template on the fly
}

registerMiniGame<MadLibsConfig>({
  type: 'madlibs_challenge',
  name: 'Mad Libs Challenge',

  component: MadLibsUI as any,

  extractConfig: () => {
    // Mad Libs always works - no special setup needed
    // The component itself calls the AI to generate the template
    return {};
  },

  // No special turn data needed
});
