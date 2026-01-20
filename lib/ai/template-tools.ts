/**
 * Input Template Tools
 *
 * Tools for collecting player input using the template system.
 * Each tool corresponds to an input template and returns the configuration
 * needed to render that template.
 */

import { registerTool } from './tools';
import type { ToolDefinition } from './types';

/**
 * Tool: Ask for detailed text response
 * Uses: tpl_text_area template
 */
registerTool<{
  prompt: string;
  subtitle?: string;
  maxLength?: number;
  minLength?: number;
  placeholder?: string;
}>(
  {
    type: 'function',
    name: 'ask_for_text',
    description: 'Ask the current player for a detailed, paragraph-length text response. Use this for questions that require explanation, storytelling, or deep answers. Examples: "Describe your most embarrassing moment", "What\'s Dad\'s \'tell\' when he\'s lying?", "Explain why Mom is the best cook".',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The main question or prompt to display to the player. Should be clear and specific.',
        },
        subtitle: {
          type: 'string',
          description: 'Optional secondary text for additional context or humor (e.g., "Don\'t worry, we won\'t judge... much")',
        },
        maxLength: {
          type: 'number',
          description: 'Maximum character limit for the response (default: 500)',
          default: 500,
        },
        minLength: {
          type: 'number',
          description: 'Minimum character requirement (default: 1)',
          default: 1,
        },
        placeholder: {
          type: 'string',
          description: 'Placeholder text shown in empty text area',
          default: 'Type your answer...',
        },
      },
      required: ['prompt'],
      additionalProperties: false,
    },
  },
  async (args) => {
    return {
      templateType: 'tpl_text_area',
      prompt: args.prompt,
      subtitle: args.subtitle,
      params: {
        maxLength: args.maxLength || 500,
        minLength: args.minLength || 1,
        placeholder: args.placeholder || 'Type your answer...',
      },
    };
  }
);

/**
 * Tool: Ask for multiple short answers
 * Uses: tpl_text_input template
 */
registerTool<{
  prompt: string;
  subtitle?: string;
  fieldCount: number;
  fieldLabels?: string[];
  fieldPlaceholders?: string[];
  requireAll?: boolean;
}>(
  {
    type: 'function',
    name: 'ask_for_list',
    description: 'Ask the current player for multiple short text items in a list format. Perfect for rapid-fire questions. Use when you need 2-5 short answers. Examples: "Name 3 things in your pocket", "List 5 words that describe Dad", "What are 2 places you\'ve never been?".',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The main question or prompt (e.g., "Name 3 things in your backpack right now")',
        },
        subtitle: {
          type: 'string',
          description: 'Optional additional context',
        },
        fieldCount: {
          type: 'number',
          description: 'Number of input fields to show (1-5)',
          minimum: 1,
          maximum: 5,
        },
        fieldLabels: {
          type: 'array',
          description: 'Optional labels for each field (e.g., ["Item 1", "Item 2", "Item 3"]). Length must match fieldCount.',
          items: { type: 'string' },
        },
        fieldPlaceholders: {
          type: 'array',
          description: 'Optional placeholder text for each field. Length must match fieldCount.',
          items: { type: 'string' },
        },
        requireAll: {
          type: 'boolean',
          description: 'Whether all fields must be filled before submission (default: true)',
          default: true,
        },
      },
      required: ['prompt', 'fieldCount'],
      additionalProperties: false,
    },
  },
  async (args) => {
    return {
      templateType: 'tpl_text_input',
      prompt: args.prompt,
      subtitle: args.subtitle,
      params: {
        fieldCount: args.fieldCount,
        fieldLabels: args.fieldLabels,
        fieldPlaceholders: args.fieldPlaceholders,
        requireAll: args.requireAll ?? true,
      },
    };
  }
);

/**
 * Tool: Ask for timed binary choice
 * Uses: tpl_timed_binary template
 */
registerTool<{
  prompt: string;
  subtitle?: string;
  leftText: string;
  rightText: string;
  seconds: number;
  orientation?: 'horizontal' | 'vertical';
}>(
  {
    type: 'function',
    name: 'ask_binary_choice',
    description: 'Ask the current player to make a quick "This or That" decision under time pressure. A countdown timer creates urgency. Perfect for impossible choices, preferences, or would-you-rather scenarios. Examples: "Pizza or Tacos?", "Beach or Mountains?", "Save Mom or Save Dad?".',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The question to ask (e.g., "Quick! Choose one!")',
        },
        subtitle: {
          type: 'string',
          description: 'Optional context (e.g., "You only have 5 seconds...")',
        },
        leftText: {
          type: 'string',
          description: 'Text for the left/top option. Can include emojis (e.g., "Pizza 🍕")',
        },
        rightText: {
          type: 'string',
          description: 'Text for the right/bottom option. Can include emojis (e.g., "Tacos 🌮")',
        },
        seconds: {
          type: 'number',
          description: 'Time limit in seconds. Casual: 10-15, Spicy: 5-8, Savage: 3-5',
          minimum: 3,
          maximum: 30,
        },
        orientation: {
          type: 'string',
          enum: ['horizontal', 'vertical'],
          description: 'Layout direction for the two options (default: vertical)',
          default: 'vertical',
        },
      },
      required: ['prompt', 'leftText', 'rightText', 'seconds'],
      additionalProperties: false,
    },
  },
  async (args) => {
    return {
      templateType: 'tpl_timed_binary',
      prompt: args.prompt,
      subtitle: args.subtitle,
      params: {
        leftText: args.leftText,
        rightText: args.rightText,
        seconds: args.seconds,
        orientation: args.orientation || 'vertical',
      },
    };
  }
);

/**
 * Tool: Ask player to select words from a grid
 * Uses: tpl_word_grid template
 */
registerTool<{
  prompt: string;
  subtitle?: string;
  words: string[];
  gridSize: 4 | 9 | 16 | 25;
  selectionMode: 'single' | 'multiple';
  minSelections?: number;
  maxSelections?: number;
  instructions?: string;
}>(
  {
    type: 'function',
    name: 'ask_word_selection',
    description: 'Ask the current player to select word(s) from a grid of options. Great for choosing attributes, emotions, or associations. Examples: "Select 3 words that describe Mom", "Which foods do you hate?", "Pick emotions you\'re feeling".',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The main question (e.g., "Select 3 words that best describe Dad")',
        },
        subtitle: {
          type: 'string',
          description: 'Optional additional context',
        },
        words: {
          type: 'array',
          description: 'Array of words/options to display. Must provide exactly 4, 9, 16, or 25 words to match the grid size.',
          items: { type: 'string' },
          minItems: 4,
          maxItems: 25,
        },
        gridSize: {
          type: 'number',
          enum: [4, 9, 16, 25],
          description: 'Grid layout: 4 (2x2), 9 (3x3), 16 (4x4), or 25 (5x5). Must match the length of the words array.',
        },
        selectionMode: {
          type: 'string',
          enum: ['single', 'multiple'],
          description: 'Whether player can select one word or multiple words',
        },
        minSelections: {
          type: 'number',
          description: 'Minimum selections required (for multiple mode, default: 1)',
          minimum: 1,
          default: 1,
        },
        maxSelections: {
          type: 'number',
          description: 'Maximum selections allowed (for multiple mode)',
          minimum: 1,
        },
        instructions: {
          type: 'string',
          description: 'Custom instruction text (e.g., "Choose exactly 3")',
        },
      },
      required: ['prompt', 'words', 'gridSize', 'selectionMode'],
      additionalProperties: false,
    },
  },
  async (args) => {
    return {
      templateType: 'tpl_word_grid',
      prompt: args.prompt,
      subtitle: args.subtitle,
      params: {
        words: args.words,
        gridSize: args.gridSize,
        selectionMode: args.selectionMode,
        minSelections: args.minSelections,
        maxSelections: args.maxSelections,
        instructions: args.instructions,
      },
    };
  }
);

/**
 * Tool: Ask for rating on a scale
 * Uses: tpl_slider template
 */
registerTool<{
  prompt: string;
  subtitle?: string;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  minLabel?: string;
  maxLabel?: string;
  showValue?: boolean;
}>(
  {
    type: 'function',
    name: 'ask_rating',
    description: 'Ask the current player to rate something on a numeric scale using a slider. Perfect for nuanced ratings and measurements. Examples: "How hungry is Mom? (0-10)", "Rate Dad\'s driving skills (1-5)", "How awkward is this moment? (0-100)".',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The question to ask (e.g., "How hungry are you RIGHT NOW?")',
        },
        subtitle: {
          type: 'string',
          description: 'Optional additional context',
        },
        min: {
          type: 'number',
          description: 'Minimum value on the scale',
        },
        max: {
          type: 'number',
          description: 'Maximum value on the scale',
        },
        step: {
          type: 'number',
          description: 'Increment value (default: 1)',
          default: 1,
        },
        defaultValue: {
          type: 'number',
          description: 'Starting position of the slider (defaults to middle)',
        },
        minLabel: {
          type: 'string',
          description: 'Label text for minimum end (e.g., "Not hungry")',
        },
        maxLabel: {
          type: 'string',
          description: 'Label text for maximum end (e.g., "STARVING")',
        },
        showValue: {
          type: 'boolean',
          description: 'Whether to display the numeric value above the slider (default: true)',
          default: true,
        },
      },
      required: ['prompt', 'min', 'max'],
      additionalProperties: false,
    },
  },
  async (args) => {
    return {
      templateType: 'tpl_slider',
      prompt: args.prompt,
      subtitle: args.subtitle,
      params: {
        min: args.min,
        max: args.max,
        step: args.step || 1,
        defaultValue: args.defaultValue,
        minLabel: args.minLabel,
        maxLabel: args.maxLabel,
        showValue: args.showValue ?? true,
      },
    };
  }
);

/**
 * Tool: Ask player to vote for another player
 * Uses: tpl_player_selector template
 */
registerTool<{
  prompt: string;
  subtitle?: string;
  allowMultiple?: boolean;
  maxSelections?: number;
  instructions?: string;
}>(
  {
    type: 'function',
    name: 'ask_player_vote',
    description: 'Ask the current player to select or vote for another player from the game. Perfect for "most likely to", accusations, compliments, or targeting. The current player is automatically excluded from the selection. Examples: "Who\'s most likely to survive a zombie apocalypse?", "Who\'s the worst driver?", "Who would you trust with a secret?".',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The voting question (e.g., "Who is most likely to forget someone\'s birthday?")',
        },
        subtitle: {
          type: 'string',
          description: 'Optional additional context or humor',
        },
        allowMultiple: {
          type: 'boolean',
          description: 'Whether the player can select multiple people (default: false)',
          default: false,
        },
        maxSelections: {
          type: 'number',
          description: 'Maximum number of players that can be selected if allowMultiple is true (default: 1)',
          minimum: 1,
          default: 1,
        },
        instructions: {
          type: 'string',
          description: 'Custom instruction text (e.g., "Choose wisely...")',
        },
      },
      required: ['prompt'],
      additionalProperties: false,
    },
  },
  async (args) => {
    return {
      templateType: 'tpl_player_selector',
      prompt: args.prompt,
      subtitle: args.subtitle,
      params: {
        allowMultiple: args.allowMultiple ?? false,
        maxSelections: args.maxSelections || 1,
        instructions: args.instructions,
      },
    };
  }
);

/**
 * Tool: Trigger a trivia challenge
 * Uses: trivia_challenge mini-game
 *
 * This tool signals that the AI wants to start a trivia challenge
 * instead of a regular question. The actual trivia question generation
 * is handled by a separate "Quizmaster" AI prompt.
 */
registerTool<{
  sourcePlayerId: string;
  sourcePlayerName: string;
  intro: string;
}>(
  {
    type: 'function',
    name: 'trigger_trivia_challenge',
    description: 'Start a TRIVIA CHALLENGE mini-game! Quiz the current player on something another player said earlier. ONLY available in Act 2 or later, and ONLY if there are completed turns from other players. Use this to create tension and test how well players know each other. The actual trivia question will be generated by the Quizmaster AI.',
    parameters: {
      type: 'object',
      properties: {
        sourcePlayerId: {
          type: 'string',
          description: 'The ID of the player whose answer will be used for the trivia question',
        },
        sourcePlayerName: {
          type: 'string',
          description: 'The name of the player whose answer will be used (for display)',
        },
        intro: {
          type: 'string',
          description: 'A short, dramatic intro for the challenge (e.g., "Time to see how well you REALLY know your sister...")',
        },
      },
      required: ['sourcePlayerId', 'sourcePlayerName', 'intro'],
      additionalProperties: false,
    },
  },
  async (args) => {
    return {
      templateType: 'trivia_challenge',
      params: {
        sourcePlayerId: args.sourcePlayerId,
        sourcePlayerName: args.sourcePlayerName,
        intro: args.intro,
      },
    };
  }
);

/**
 * Tool: Trigger a personality match challenge
 * Uses: personality_match mini-game
 *
 * This tool signals that the AI wants to start a personality match game.
 * The current player must select ALL words that describe another player.
 * Scoring is based on previous group responses about that player.
 */
registerTool<{
  subjectPlayerId: string;
  subjectPlayerName: string;
  intro: string;
}>(
  {
    type: 'function',
    name: 'trigger_personality_match',
    description: 'Start a PERSONALITY MATCH mini-game! The current player selects ALL personality words that describe another player. ONLY available in Act 2 or later. Great for testing how well players perceive each other. The Analyst AI will score based on previous responses.',
    parameters: {
      type: 'object',
      properties: {
        subjectPlayerId: {
          type: 'string',
          description: 'The ID of the player whose personality will be matched (NOT the current player)',
        },
        subjectPlayerName: {
          type: 'string',
          description: 'The name of the player whose personality will be matched',
        },
        intro: {
          type: 'string',
          description: 'A short intro for the challenge (e.g., "Time to see how well you know your mom...")',
        },
      },
      required: ['subjectPlayerId', 'subjectPlayerName', 'intro'],
      additionalProperties: false,
    },
  },
  async (args) => {
    return {
      templateType: 'personality_match',
      params: {
        subjectPlayerId: args.subjectPlayerId,
        subjectPlayerName: args.subjectPlayerName,
        intro: args.intro,
      },
    };
  }
);

/**
 * Tool: Trigger Mad Libs Challenge
 * A fill-in-the-blank word game where the AI generates a template and player fills in words.
 */
registerTool<{
  intro?: string;
}>(
  {
    type: 'function',
    name: 'trigger_madlibs_challenge',
    description: 'Start a MAD LIBS mini-game! Generate a funny fill-in-the-blank sentence template. The player fills blanks with words starting with specific letters. The AI scores for creativity and humor. Available anytime - no player data needed!',
    parameters: {
      type: 'object',
      properties: {
        intro: {
          type: 'string',
          description: 'Optional intro text for the challenge (e.g., "Time to get creative with words!")',
        },
      },
      additionalProperties: false,
    },
  },
  async (args) => {
    return {
      templateType: 'madlibs_challenge',
      params: {
        intro: args.intro || 'Mad Libs time!',
      },
    };
  }
);

/**
 * Tool: Trigger Cryptic Connection Challenge
 * A word association puzzle where the player finds hidden connections in a 5x5 grid.
 */
registerTool<{
  intro?: string;
}>(
  {
    type: 'function',
    name: 'trigger_cryptic_connection',
    description: 'Start a CRYPTIC CONNECTION mini-game! Present a vague, enigmatic clue and a 5x5 grid of 25 words. The player must find which words secretly connect to the riddle. AI scores with fuzzy logic - creative interpretations get partial credit. The puzzle should be hard and cryptic. Available anytime - no player data needed!',
    parameters: {
      type: 'object',
      properties: {
        intro: {
          type: 'string',
          description: 'Optional intro text for the challenge (e.g., "The Riddler has a mystery for you...")',
        },
      },
      additionalProperties: false,
    },
  },
  async (args) => {
    return {
      templateType: 'cryptic_connection',
      params: {
        intro: args.intro || 'A riddle awaits...',
      },
    };
  }
);

/**
 * Tool: Trigger Hard Trivia Challenge
 * Ask challenging trivia questions based on the family's interests and hobbies.
 */
registerTool<{
  intro?: string;
}>(
  {
    type: 'function',
    name: 'trigger_hard_trivia',
    description: 'Start a HARD TRIVIA mini-game! Ask a challenging trivia question based on topics the family is interested in (movies, sports, music, cooking, etc.). Multiple choice format. 5 points for correct answer. Use this to test their knowledge on subjects they love! Available Act 2+ - works best when you know their interests.',
    parameters: {
      type: 'object',
      properties: {
        intro: {
          type: 'string',
          description: 'Optional intro text for the challenge (e.g., "Time to test your movie knowledge!")',
        },
      },
      additionalProperties: false,
    },
  },
  async (args) => {
    return {
      templateType: 'hard_trivia',
      params: {
        intro: args.intro || 'Time to test your knowledge!',
      },
    };
  }
);
