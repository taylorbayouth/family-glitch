/**
 * Personality Match Registration
 *
 * Registers the Personality Match mini-game with the central registry.
 */

import type { ComponentType } from 'react';
import { PersonalityMatchUI } from '@/components/mini-games/PersonalityMatchUI';
import { registerMiniGame, type MiniGameConfig, type MiniGamePlayer, type BaseMiniGameProps } from '../registry';

// Config specific to Personality Match
export interface PersonalityMatchConfig extends MiniGameConfig {
  subjectPlayer: MiniGamePlayer;
}

registerMiniGame<PersonalityMatchConfig>({
  type: 'personality_match',
  name: 'Personality Match',

  component: PersonalityMatchUI as ComponentType<BaseMiniGameProps & PersonalityMatchConfig>,

  extractConfig: (templateConfig, context) => {
    const { players } = context;

    const subjectPlayerId = templateConfig.params?.subjectPlayerId as string | undefined;
    const subjectPlayerName = templateConfig.params?.subjectPlayerName as string | undefined;

    if (!subjectPlayerId || !subjectPlayerName) {
      return null; // Invalid config
    }

    // Find the subject player from the players array
    const subjectPlayer = players.find(p => p.id === subjectPlayerId);

    if (!subjectPlayer) {
      return null; // Subject player not found
    }

    return {
      subjectPlayer,
    };
  },

  getTurnData: (config) => ({
    subjectPlayerId: config.subjectPlayer.id,
    subjectPlayerName: config.subjectPlayer.name,
  }),
});
