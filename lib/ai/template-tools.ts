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
    description: 'Ask for a short, specific story or explanation that creates a concrete detail for later payoff. Use for memorable moments, habits, or confessions. Keep the prompt short and avoid player names.',
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
    description: 'Ask for 2-5 short items in a list. Great for fast, punchy answers that can be referenced later. Keep items concrete (names, places, objects).',
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
    description: 'Ask a quick "this or that" under time pressure. Keep options short and funny. Use for forced choices, preferences, or spicy dilemmas.',
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
    description: 'Ask the player to select words from a grid. Provide exactly 4, 9, 16, or 25 words and include decoys for tension. Use for vibe checks and personality reads.',
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
    description: 'Ask the player to rate something on a numeric scale. Use clear extremes and short labels. Best for comparisons and self-assessments.',
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
    description: 'Ask the player to vote for another player. Best for "most likely to" or light accusations. The current player is automatically excluded.',
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
    description: 'Start a TRIVIA CHALLENGE. Quiz the current player on a specific answer from another player. Only use when there is eligible data from others. Provide a short dramatic intro.',
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
    description: 'Start a PERSONALITY MATCH. The current player selects ALL words that describe another player. Use only when there is enough prior data. Provide a short intro.',
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
    description: 'Start a MAD LIBS mini-game. Generate a funny fill-in-the-blank sentence (1-3 blanks). The system assigns starting letters and scores creativity.',
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
    description: 'Start a CRYPTIC CONNECTION mini-game. Provide a cryptic clue and 25-word grid with 5-8 correct words. Scoring rewards creative interpretations.',
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
    description: 'Start a HARD TRIVIA mini-game. Ask a challenging multiple-choice question tied to known interests (or general pop culture if none). 5 points for correct.',
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

/**
 * Tool: Trigger The Filter Challenge
 * Binary classification game where players identify items that pass a specific rule.
 */
registerTool<{
  intro?: string;
}>(
  {
    type: 'function',
    name: 'trigger_the_filter',
    description: 'Start THE FILTER mini-game. Players identify all items that pass a specific rule (history, science, logic, etc.). Fast-paced binary classification.',
    parameters: {
      type: 'object',
      properties: {
        intro: {
          type: 'string',
          description: 'Optional intro text for the challenge (e.g., "Time to test your knowledge!")',
        },
      },
      additionalProperties: false,
    },
  },
  async (args) => {
    return {
      templateType: 'the_filter',
      params: {
        intro: args.intro || 'Apply the filter!',
      },
    };
  }
);
