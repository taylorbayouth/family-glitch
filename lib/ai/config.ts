import { AIRequestConfig } from './types';

/**
 * Default AI configuration
 */
export const DEFAULT_CONFIG: Required<AIRequestConfig> = {
  model: 'gpt-5.2',
  temperature: 0.7,
  maxTokens: 4096,
  tools: [], // Empty = all tools available
  reasoningEffort: 'medium',
  stream: true,
};

/**
 * Available models
 */
export const MODELS = {
  GPT_5_2: 'gpt-5.2',
  GPT_5_2_INSTANT: 'gpt-5.2-instant',
  GPT_5_2_THINKING: 'gpt-5.2-thinking',
  GPT_5_2_PRO: 'gpt-5.2-pro',
  GPT_4_TURBO: 'gpt-4-turbo',
  GPT_4: 'gpt-4',
} as const;

/**
 * Temperature presets for common use cases
 */
export const TEMPERATURE_PRESETS = {
  PRECISE: 0.0, // For factual, deterministic responses
  BALANCED: 0.7, // Default - good balance
  CREATIVE: 1.0, // For creative writing, brainstorming
} as const;

/**
 * Reasoning effort levels (GPT-5.2 feature)
 */
export const REASONING_EFFORT = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  EXTRA_HIGH: 'xhigh',
} as const;

/**
 * Merge user config with defaults
 */
export function mergeConfig(
  userConfig?: Partial<AIRequestConfig>
): Required<AIRequestConfig> {
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
  };
}

/**
 * Validate API key is present
 */
export function validateApiKey(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY is not set in environment variables'
    );
  }
}
