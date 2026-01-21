/**
 * Input Templates Registry
 *
 * Central export point for all input templates. Provides a factory function
 * to render the correct template based on template type.
 */

import { TextAreaTemplate } from './TextAreaTemplate';
import { TextInputTemplate } from './TextInputTemplate';
import { TimedBinaryTemplate } from './TimedBinaryTemplate';
import { WordGridTemplate } from './WordGridTemplate';
import { SliderTemplate } from './SliderTemplate';
import { PlayerSelectorTemplate } from './PlayerSelectorTemplate';

import type {
  TemplateType,
  TemplateParams,
  TextAreaParams,
  TextInputParams,
  TimedBinaryParams,
  WordGridParams,
  SliderParams,
  PlayerSelectorParams,
} from '@/lib/types/template-params';

// Export all templates
export {
  TextAreaTemplate,
  TextInputTemplate,
  TimedBinaryTemplate,
  WordGridTemplate,
  SliderTemplate,
  PlayerSelectorTemplate,
};

// Export types
export type {
  TemplateType,
  TemplateParams,
  TextAreaParams,
  TextInputParams,
  TimedBinaryParams,
  WordGridParams,
  SliderParams,
  PlayerSelectorParams,
};

/**
 * Template Registry
 * Maps template types to their component implementations
 */
export const TEMPLATE_REGISTRY = {
  tpl_text_area: TextAreaTemplate,
  tpl_text_input: TextInputTemplate,
  tpl_timed_binary: TimedBinaryTemplate,
  tpl_word_grid: WordGridTemplate,
  tpl_slider: SliderTemplate,
  tpl_player_selector: PlayerSelectorTemplate,
} as const;

/**
 * Template Renderer Component
 *
 * Factory component that renders the appropriate template based on type.
 * Use this in your game flow to dynamically render templates.
 *
 * @example
 * ```tsx
 * <TemplateRenderer
 *   templateType="tpl_text_area"
 *   params={{
 *     prompt: "What's your favorite food?",
 *     maxLength: 200,
 *     onSubmit: handleSubmit,
 *   }}
 * />
 * ```
 */
interface TemplateRendererProps {
  templateType: TemplateType;
  params: TemplateParams;
}

export function TemplateRenderer({
  templateType,
  params,
}: TemplateRendererProps) {
  const TemplateComponent = TEMPLATE_REGISTRY[templateType];

  if (!TemplateComponent) {
    return (
      <div className="min-h-full bg-void flex items-center justify-center p-6">
        <div className="text-alert font-mono">
          Unknown template type: {templateType}
        </div>
      </div>
    );
  }

  // Type assertion needed here because TypeScript can't narrow the union type automatically
  return <TemplateComponent {...(params as any)} />;
}

/**
 * Helper function to validate template parameters
 * Useful for debugging and ensuring AI sends correct data
 */
export function validateTemplateParams(
  templateType: TemplateType,
  params: any
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check base requirements
  if (!params.prompt) {
    errors.push('Missing required field: prompt');
  }
  if (!params.onSubmit || typeof params.onSubmit !== 'function') {
    errors.push('Missing required function: onSubmit');
  }

  // Template-specific validation
  switch (templateType) {
    case 'tpl_text_area':
      // Optional validation
      break;

    case 'tpl_text_input':
      if (!params.fieldCount || params.fieldCount < 1 || params.fieldCount > 5) {
        errors.push('fieldCount must be between 1 and 5');
      }
      break;

    case 'tpl_timed_binary':
      if (!params.leftText) errors.push('Missing required field: leftText');
      if (!params.rightText) errors.push('Missing required field: rightText');
      if (!params.seconds || params.seconds < 1) {
        errors.push('seconds must be greater than 0');
      }
      break;

    case 'tpl_word_grid':
      if (!params.words || !Array.isArray(params.words)) {
        errors.push('words must be an array');
      }
      if (![4, 9, 16].includes(params.gridSize)) {
        errors.push('gridSize must be 4, 9, or 16');
      }
      if (!['single', 'multiple'].includes(params.selectionMode)) {
        errors.push('selectionMode must be "single" or "multiple"');
      }
      break;

    case 'tpl_slider':
      if (params.min === undefined) errors.push('Missing required field: min');
      if (params.max === undefined) errors.push('Missing required field: max');
      if (params.min >= params.max) {
        errors.push('min must be less than max');
      }
      break;

    case 'tpl_player_selector':
      if (!params.players || !Array.isArray(params.players)) {
        errors.push('players must be an array');
      }
      if (!params.currentPlayerId) {
        errors.push('Missing required field: currentPlayerId');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
