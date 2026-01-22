/**
 * Trivia Challenge AI Prompt
 *
 * The Quizmaster tests how well family members know each other
 * by challenging them to guess what someone would say.
 * Note: Act 1 answers are SECRET - players never heard what others said!
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
Test how well ${targetName}${targetAge ? ` (age ${targetAge})` : ''} knows ${sourceName} by asking them to GUESS what ${sourceName} would say.

CRITICAL: ${targetName} has NEVER heard ${sourceName}'s answer! Act 1 answers were SECRET. This is about knowing the person, NOT memory.

## What ${sourceName} Actually Said (SECRET - ${targetName} doesn't know this)
Question: "${sourcePrompt}"
Answer: ${responseText}

## How to Ask Good Questions

Frame questions as "How well do you know ${sourceName}?" challenges - NOT "Do you remember" questions.

Good: "What show do you think ${sourceName} is obsessed with?"
Good: "Where would ${sourceName} want to travel?"
Good: "What would ${sourceName} call their secret talent?"

Bad: "What did ${sourceName} say about..." (implies they heard it)
Bad: "Do you remember what ${sourceName} said?" (this isn't a memory test!)
Bad: "What was the SECOND thing ${sourceName} listed?" (nobody knows - it was secret!)

Focus on the MEMORABLE or DISTINCTIVE part of the answer - something family members would know about each other even without hearing the answer.

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
