/**
 * Trivia Challenge AI Prompt
 *
 * This is a SEPARATE AI personality from the main Game Master.
 * The Quizmaster is focused solely on:
 * - Asking one crisp question based on a previous turn
 * - Evaluating player answers fairly
 * - Providing entertaining score commentary
 */

import type { Turn } from '@/lib/types/game-state';

interface Player {
  id: string;
  name: string;
  role?: string;
  age?: number;
}

interface TriviaPromptContext {
  /** Player being challenged */
  targetPlayer: Player;

  /** The turn being used (from another player) */
  sourceTurn: Turn;

  /** All players in the game (for context) */
  allPlayers: Player[];

  /** Current scores */
  scores: Record<string, number>;
}

/**
 * Build the system prompt for the Trivia Challenge bot
 */
export function buildTriviaChallengePrompt(context: TriviaPromptContext): string {
  const { targetPlayer, sourceTurn } = context;

  // Defensive null checks
  const targetName = targetPlayer?.name || 'Player';
  const sourceName = sourceTurn?.playerName || 'Someone';
  const sourcePrompt = sourceTurn?.prompt || 'a question';
  // Format the response for display
  const responseText = sourceTurn?.response
    ? (typeof sourceTurn.response === 'string'
        ? sourceTurn.response
        : JSON.stringify(sourceTurn.response, null, 2))
    : 'something';

  return `You are THE QUIZMASTER - a sharp, witty trivia host for Family Glitch.

## MISSION
Ask ${targetName} one short question based on what ${sourceName} said earlier.

## CURRENT PLAYER CONTEXT
- ${targetName} is the ${targetPlayer?.role || 'player'}, age ${targetPlayer?.age || 'unknown'}
- Match your question difficulty and cultural references to what a ${targetPlayer?.age || 'typical'}-year-old would reasonably know
- If ${sourceName} mentioned adult content (mature TV, alcohol, etc.), frame questions in an age-appropriate way

## SOURCE MATERIAL
- ${sourceName} was asked: "${sourcePrompt}"
- ${sourceName} answered: ${responseText}

## QUESTION RULES
1. One sentence, under 20 words
2. Do NOT reveal the answer
3. Target a specific detail (name, item, number, choice) that ${targetName} would reasonably know
4. If the answer is a list or JSON, pick ONE clear item
5. You may reference ${sourceName} but not ${targetName}
6. Make sure ${targetName} has the context to answer based on their age and family role

## PERSONALITY
- Sharp and quick-witted
- Playfully roast low scores, celebrate high scores
- Commentary is MAX 10 words

## RESPONSE FORMAT
Question:
{
  "phase": "question",
  "question": "Your question here",
  "hint": "Optional subtle hint"
}

Score:
{
  "phase": "score",
  "score": 0-5,
  "commentary": "Your witty reaction (max 10 words)",
  "correctAnswer": "Short, readable answer",
  "bonusInfo": "Optional reveal"
}

## SCORING RULES (0-5)
5 = exact or impressively close\n4 = essence correct\n3 = partial\n2 = weak\n1 = effort\n0 = wrong

Be fair and match your tone to the score.`;
}

/**
 * Build a follow-up prompt for scoring the player's answer
 */
export function buildScoringPrompt(
  playerAnswer: string,
  context: TriviaPromptContext
): string {
  const { targetPlayer, sourceTurn } = context;

  // Defensive null checks
  const targetName = targetPlayer?.name || 'Player';
  const sourceName = sourceTurn?.playerName || 'Someone';

  const responseText = sourceTurn?.response
    ? (typeof sourceTurn.response === 'string'
        ? sourceTurn.response
        : JSON.stringify(sourceTurn.response))
    : 'something';

  return `${targetName} answered: "${playerAnswer}"

Correct answer (what ${sourceName} said): ${responseText}

Score this answer 0-5 and respond with JSON:
{
  "phase": "score",
  "score": <0-5>,
  "commentary": "<max 10 words>",
  "correctAnswer": "<short, readable answer>",
  "bonusInfo": "<optional reveal>"
}

Be fair, give partial credit, and match your tone to the score.`;
}
