/**
 * Hard Trivia Challenge - AI Prompts
 *
 * Generates challenging trivia questions based on the player's
 * own interests and hobbies collected during the game.
 */

import type { Turn } from '@/lib/types/game-state';
import type { MiniGamePlayer } from '../registry';

export interface GeneratePromptContext {
  targetPlayer: MiniGamePlayer;
  allPlayers: MiniGamePlayer[];
  turns: Turn[];
}

export interface ScorePromptContext {
  targetPlayer: MiniGamePlayer;
  question: string;
  correctAnswer: string;
  playerAnswer: string;
  options: string[];
}

/**
 * Build prompt for generating hard trivia questions
 */
export function buildHardTriviaGeneratorPrompt(context: GeneratePromptContext): string {
  const { targetPlayer, turns } = context;

  const targetName = targetPlayer?.name || 'Player';
  const targetAge = targetPlayer?.age || 0;
  const targetRole = targetPlayer?.role || 'player';

  // Find what this player has said about their interests
  const playerTurns = (turns || []).filter(t =>
    t &&
    t.playerId === targetPlayer?.id &&
    t.status === 'completed' &&
    t.response
  );

  // Also gather what others have mentioned (backup context)
  const allCompletedTurns = (turns || []).filter(t =>
    t && t.status === 'completed' && t.response
  );

  const playerContext = playerTurns.length > 0
    ? `What ${targetName} has shared:\n${playerTurns.slice(-5).map(t => `- "${t.prompt}" → ${JSON.stringify(t.response)}`).join('\n')}`
    : '';

  const familyContext = allCompletedTurns.length > 0
    ? `What the family has shared:\n${allCompletedTurns.slice(-5).map(t => `- ${t.playerName}: "${t.prompt}" → ${JSON.stringify(t.response)}`).join('\n')}`
    : '';

  return `You are THE QUIZMASTER for Family Glitch's Hard Trivia.

## Your Job
Create a challenging trivia question for ${targetName} (${targetRole}, age ${targetAge}).

${playerContext}

${familyContext}

## How to Make Great Questions

Use what you know about ${targetName} to ask something in THEIR wheelhouse:
- If they mentioned loving Marvel movies, ask about Marvel
- If they're into gaming, ask about games they'd know
- If they love cooking, ask about cuisine

Match the difficulty to their age - a 10-year-old knows different things than a 40-year-old, but both deserve challenging questions in their domain.

If you don't have specific interest data, use topics appropriate to their age and likely world (pop culture, school subjects, hobbies common for their demographic).

## Format

Respond with ONLY valid JSON:
{
  "category": "Movies",
  "question": "Which superhero does Tony Stark become?",
  "options": ["Iron Man", "Captain America", "Thor", "Hulk"],
  "correct_answer": "Iron Man"
}

The correct_answer must EXACTLY match one option.
One question, four options, one clear answer.`;
}

/**
 * Build prompt for scoring the player's answer
 */
export function buildHardTriviaScorerPrompt(context: ScorePromptContext): string {
  const { targetPlayer, question, correctAnswer, playerAnswer, options } = context;

  const targetName = targetPlayer?.name || 'Player';

  return `${targetName} was asked: "${question}"
Options: ${(options || []).join(', ')}
Correct answer: ${correctAnswer}
Their answer: ${playerAnswer}

Score and respond:
{"correct": true/false, "points": 5 or 0, "commentary": "Max 12 words"}

5 points if correct, 0 if wrong. Keep commentary short and fun.`;
}
