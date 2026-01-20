/**
 * Hard Trivia Challenge
 *
 * Challenging trivia questions based on family interests and hobbies.
 */

import type { MiniGameResult } from '../types';

export * from './prompt';

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface HardTriviaGenerateResponse {
  category: string;
  question: string;
  options: string[]; // 4 multiple choice options
  correct_answer: string;
}

export interface HardTriviaScoreResponse {
  correct: boolean;
  points: number;
  commentary: string;
}

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

/**
 * Parse the AI's trivia question generation response
 */
export function parseHardTriviaGeneratorResponse(text: string): HardTriviaGenerateResponse {
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || text.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;

    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    if (!parsed.category || typeof parsed.category !== 'string') {
      throw new Error('Missing or invalid category');
    }
    if (!parsed.question || typeof parsed.question !== 'string') {
      throw new Error('Missing or invalid question');
    }
    if (!Array.isArray(parsed.options) || parsed.options.length !== 4) {
      throw new Error('Options must be an array of exactly 4 strings');
    }
    if (!parsed.correct_answer || typeof parsed.correct_answer !== 'string') {
      throw new Error('Missing or invalid correct_answer');
    }

    // Verify correct_answer is in options
    if (!parsed.options.includes(parsed.correct_answer)) {
      throw new Error('correct_answer must match one of the options');
    }

    return {
      category: parsed.category,
      question: parsed.question,
      options: parsed.options,
      correct_answer: parsed.correct_answer,
    };
  } catch (error) {
    console.error('Failed to parse Hard Trivia generator response:', error);
    console.error('Raw text:', text);
    throw new Error(`Invalid trivia generation response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse the AI's scoring response
 */
export function parseHardTriviaScoreResponse(text: string): HardTriviaScoreResponse {
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || text.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;

    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    if (typeof parsed.correct !== 'boolean') {
      throw new Error('Missing or invalid correct field');
    }
    if (typeof parsed.points !== 'number') {
      throw new Error('Missing or invalid points field');
    }
    if (!parsed.commentary || typeof parsed.commentary !== 'string') {
      throw new Error('Missing or invalid commentary');
    }

    return {
      correct: parsed.correct,
      points: parsed.points,
      commentary: parsed.commentary,
    };
  } catch (error) {
    console.error('Failed to parse Hard Trivia score response:', error);
    console.error('Raw text:', text);
    throw new Error(`Invalid score response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert score response to MiniGameResult
 */
export function toMiniGameResult(scoreResponse: HardTriviaScoreResponse): MiniGameResult {
  return {
    score: scoreResponse.points,
    maxScore: 10,
    commentary: scoreResponse.commentary,
  };
}
