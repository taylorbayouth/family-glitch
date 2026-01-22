/**
 * Trivia Challenge Mini-Game
 *
 * Flow:
 * 1. Select a turn from another player
 * 2. Present question to current player
 * 3. Player answers
 * 4. AI scores (0-5) with commentary
 * 5. Update score in real-time
 *
 * NO separate facts store needed - works directly with turns array.
 */

import type { Turn } from '@/lib/types/game-state';
import type { TriviaChallengeSession } from '../types';

// Re-export prompt builders
export { buildTriviaChallengePrompt, buildScoringPrompt } from './prompt';

// ============================================================================
// SESSION CREATION
// ============================================================================

interface Player {
  id: string;
  name: string;
  role?: string;
}


// ============================================================================
// RESPONSE PARSING
// ============================================================================

export interface TriviaQuestionResponse {
  phase: 'question';
  question: string;
}

export interface TriviaScoreResponse {
  phase: 'score';
  score: number;
  commentary: string;
  correctAnswer: string;
  bonusInfo?: string;
}

export type TriviaAIResponse = TriviaQuestionResponse | TriviaScoreResponse;

/**
 * Parse the AI's JSON response
 */
export function parseTriviaChallengeResponse(
  responseText: string
): TriviaAIResponse | null {
  try {
    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', responseText);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate the response structure
    if (parsed.phase === 'question') {
      if (typeof parsed.question !== 'string') {
        console.error('Invalid question response:', parsed);
        return null;
      }
      return parsed as TriviaQuestionResponse;
    }

    if (parsed.phase === 'score') {
      if (
        typeof parsed.score !== 'number' ||
        parsed.score < 0 ||
        parsed.score > 5 ||
        typeof parsed.commentary !== 'string'
      ) {
        console.error('Invalid score response:', parsed);
        return null;
      }
      return parsed as TriviaScoreResponse;
    }

    console.error('Unknown phase:', parsed.phase);
    return null;
  } catch (error) {
    console.error('Failed to parse trivia response:', error);
    return null;
  }
}
