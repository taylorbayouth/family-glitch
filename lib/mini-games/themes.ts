/**
 * Mini-Game Theme Configuration
 *
 * Centralizes color schemes and visual identity for each mini-game.
 * Each game has a unique color palette for instant recognition.
 */

export interface MiniGameTheme {
  /** Display name for the game */
  name: string;

  /** Primary color (main buttons, accents) */
  primary: string;

  /** Secondary/hover color */
  secondary: string;

  /** Background gradient colors */
  gradientFrom: string;
  gradientTo: string;

  /** Shadow color (for glow effects) */
  shadowColor: string;

  /** Emoji icon for the game */
  emoji: string;
}

/**
 * Theme definitions for all mini-games
 *
 * Note: Each game has a unique color scheme to make them instantly recognizable
 * and to provide visual variety throughout the gameplay experience.
 */
export const MINI_GAME_THEMES: Record<string, MiniGameTheme> = {
  trivia_challenge: {
    name: 'Trivia Challenge',
    primary: 'glitch',
    secondary: 'glitch-bright',
    gradientFrom: 'from-glitch/20',
    gradientTo: 'to-glitch/10',
    shadowColor: 'rgba(108, 92, 231, 0.3)',
    emoji: '🎯',
  },

  hard_trivia: {
    name: 'Hard Trivia',
    primary: 'cyan-500',
    secondary: 'cyan-400',
    gradientFrom: 'from-cyan-500/20',
    gradientTo: 'to-cyan-600/10',
    shadowColor: 'rgba(6, 182, 212, 0.3)',
    emoji: '🧠',
  },

  madlibs_challenge: {
    name: 'Mad Libs',
    primary: 'amber-400',
    secondary: 'amber-300',
    gradientFrom: 'from-amber-400/20',
    gradientTo: 'to-amber-500/10',
    shadowColor: 'rgba(251, 191, 36, 0.3)',
    emoji: '✍️',
  },

  personality_match: {
    name: 'Personality Match',
    primary: 'mint',
    secondary: 'mint/90',
    gradientFrom: 'from-mint/20',
    gradientTo: 'to-mint/10',
    shadowColor: 'rgba(0, 255, 170, 0.3)',
    emoji: '🔍',
  },

  cryptic_connection: {
    name: 'Cryptic Connection',
    primary: 'violet-500',
    secondary: 'violet-400',
    gradientFrom: 'from-violet-500/20',
    gradientTo: 'to-violet-600/10',
    shadowColor: 'rgba(139, 92, 246, 0.3)',
    emoji: '🔮',
  },

  // Changed from cyan to teal for uniqueness (was conflicting with hard_trivia)
  the_filter: {
    name: 'The Filter',
    primary: 'teal-500',
    secondary: 'teal-400',
    gradientFrom: 'from-teal-500/20',
    gradientTo: 'to-teal-600/10',
    shadowColor: 'rgba(20, 184, 166, 0.3)',
    emoji: '🎯',
  },

  lighting_round: {
    name: 'Lighting Round',
    primary: 'glitch-bright',
    secondary: 'glitch',
    gradientFrom: 'from-glitch/20',
    gradientTo: 'to-glitch/10',
    shadowColor: 'rgba(162, 155, 254, 0.35)',
    emoji: '⚡',
  },
};

/**
 * Get theme for a mini-game by its type
 * Returns a default theme if game type is not found
 */
export function getTheme(gameType: string): MiniGameTheme {
  return MINI_GAME_THEMES[gameType] || {
    name: 'Mini-Game',
    primary: 'glitch',
    secondary: 'glitch-bright',
    gradientFrom: 'from-glitch/20',
    gradientTo: 'to-glitch/10',
    shadowColor: 'rgba(108, 92, 231, 0.3)',
    emoji: '🎮',
  };
}

/**
 * Get Tailwind classes for a theme's primary button
 */
export function getButtonClasses(theme: MiniGameTheme): string {
  return `bg-${theme.primary} hover:bg-${theme.secondary} text-${
    theme.primary.includes('amber') || theme.primary.includes('mint') ? 'void' : 'frost'
  } font-bold py-4 px-8 rounded-xl transition-all`;
}
