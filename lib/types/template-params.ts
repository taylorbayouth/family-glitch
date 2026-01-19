/**
 * Template Parameter Definitions
 *
 * Defines the parameter interfaces for each input template.
 * These are passed to templates to configure their behavior and appearance.
 */

/**
 * Base parameters that all templates receive
 */
export interface BaseTemplateParams {
  /** The main question or prompt to display */
  prompt: string;

  /** Optional subtitle or additional instructions */
  subtitle?: string;

  /** Callback when the user submits their response */
  onSubmit: (response: any) => void;

  /** Optional callback for cancellation */
  onCancel?: () => void;
}

/**
 * Parameters for tpl_text_area - Deep, specific questions
 */
export interface TextAreaParams extends BaseTemplateParams {
  /** Maximum character limit */
  maxLength?: number;

  /** Minimum character requirement (default: 1) */
  minLength?: number;

  /** Placeholder text */
  placeholder?: string;
}

/**
 * Parameters for tpl_text_input - Rapid-fire short answers
 */
export interface TextInputParams extends BaseTemplateParams {
  /** Number of input fields to show (1-5) */
  fieldCount: number;

  /** Labels for each field (optional) */
  fieldLabels?: string[];

  /** Placeholder text for each field */
  fieldPlaceholders?: string[];

  /** Maximum length per field */
  maxLength?: number;

  /** Whether all fields are required */
  requireAll?: boolean;
}

/**
 * Parameters for tpl_timed_binary - High-pressure binary choices
 */
export interface TimedBinaryParams extends BaseTemplateParams {
  /** Text for left option */
  leftText: string;

  /** Text for right option */
  rightText: string;

  /** Time limit in seconds */
  seconds: number;

  /** Callback when timer expires (auto-submits null) */
  onTimeout?: () => void;

  /** Layout orientation */
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Parameters for tpl_word_grid - Selecting attributes/associations
 */
export interface WordGridParams extends BaseTemplateParams {
  /** Array of words/options to display */
  words: string[];

  /** Grid layout (2x2=4, 3x3=9, 4x4=16, 5x5=25) */
  gridSize: 4 | 9 | 16 | 25;

  /** Selection mode */
  selectionMode: 'single' | 'multiple';

  /** Minimum selections required (for multiple mode) */
  minSelections?: number;

  /** Maximum selections allowed (for multiple mode) */
  maxSelections?: number;

  /** Instructions text */
  instructions?: string;
}

/**
 * Parameters for tpl_slider - Nuanced ratings
 */
export interface SliderParams extends BaseTemplateParams {
  /** Minimum value */
  min: number;

  /** Maximum value */
  max: number;

  /** Step increment */
  step?: number;

  /** Initial/default value */
  defaultValue?: number;

  /** Label for minimum value */
  minLabel?: string;

  /** Label for maximum value */
  maxLabel?: string;

  /** Optional emoji or icons for value ranges */
  valueEmojis?: Record<number, string>;

  /** Show numeric value above slider */
  showValue?: boolean;
}

/**
 * Parameters for tpl_player_selector - Voting/targeting
 */
export interface PlayerSelectorParams extends BaseTemplateParams {
  /** Array of player objects to choose from */
  players: Array<{
    id: string;
    name: string;
    avatar: number;
  }>;

  /** Current player ID (will be excluded from selection) */
  currentPlayerId: string;

  /** Allow multiple selections */
  allowMultiple?: boolean;

  /** Maximum selections (if allowMultiple is true) */
  maxSelections?: number;

  /** Instructions text */
  instructions?: string;
}

/**
 * Union type of all template parameter types
 */
export type TemplateParams =
  | TextAreaParams
  | TextInputParams
  | TimedBinaryParams
  | WordGridParams
  | SliderParams
  | PlayerSelectorParams;

/**
 * Template type identifiers
 */
export type TemplateType =
  | 'tpl_text_area'
  | 'tpl_text_input'
  | 'tpl_timed_binary'
  | 'tpl_word_grid'
  | 'tpl_slider'
  | 'tpl_player_selector';
