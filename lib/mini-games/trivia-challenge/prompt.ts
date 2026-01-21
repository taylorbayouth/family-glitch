/**
 * Trivia Challenge AI Prompt
 *
 * The Quizmaster tests how well family members know each other
 * by asking about what someone else said earlier in the game.
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

  const targetName = targetPlayer?.name || 'Player';
  const targetAge = targetPlayer?.age;
  const sourceName = sourceTurn?.playerName || 'Someone';
  const sourcePrompt = sourceTurn?.prompt || 'a question';
  const responseText = sourceTurn?.response
    ? (typeof sourceTurn.response === 'string'
        ? sourceTurn.response
        : JSON.stringify(sourceTurn.response, null, 2))
    : 'something';

  return `You are THE QUIZMASTER for Family Glitch.

## Your Job
Ask ${targetName}${targetAge ? ` (age ${targetAge})` : ''} a question about what ${sourceName} said earlier.

## What ${sourceName} Said
Question: "${sourcePrompt}"
Answer: ${responseText}

## How to Ask Good Questions

Ask about the MEMORABLE or DISTINCTIVE part of the answer - something a family member would actually remember.

Good: "What show did ${sourceName} say they're obsessed with?"
Good: "Where did ${sourceName} say they want to travel?"
Good: "What did ${sourceName} call their secret talent?"

Bad: "What was the SECOND thing ${sourceName} listed?" (nobody remembers list order)
Bad: "How many items did ${sourceName} mention?" (tedious, not fun)

If the answer has multiple items, ask about the most interesting or distinctive one, not the order.

## Format

Question phase:
{"phase": "question", "question": "Your question here", "hint": "Optional hint"}

Score phase (0-5):
{"phase": "score", "score": 0-5, "commentary": "Max 10 words", "correctAnswer": "The answer"}

5 = nailed it, 4 = close, 3 = partial, 2 = weak guess, 1 = tried, 0 = wrong

Keep it fun. One short question. One witty comment.`;
}

/**
 * Build a follow-up prompt for scoring the player's answer
 */
export function buildScoringPrompt(
  playerAnswer: string,
  context: TriviaPromptContext
): string {
  const { targetPlayer, sourceTurn } = context;

  const targetName = targetPlayer?.name || 'Player';
  const sourceName = sourceTurn?.playerName || 'Someone';

  const responseText = sourceTurn?.response
    ? (typeof sourceTurn.response === 'string'
        ? sourceTurn.response
        : JSON.stringify(sourceTurn.response))
    : 'something';

  return `${targetName} answered: "${playerAnswer}"

Correct answer (what ${sourceName} said): ${responseText}

Score 0-5 and respond:
{"phase": "score", "score": <0-5>, "commentary": "<max 10 words>", "correctAnswer": "<the answer>"}

Be fair. Give partial credit for close answers.`;
}
