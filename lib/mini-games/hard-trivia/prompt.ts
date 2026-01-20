/**
 * Hard Trivia Challenge - AI Prompts
 *
 * Generates challenging trivia questions based on family interests/hobbies
 * collected during gameplay.
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

  // Defensive null checks
  const targetName = targetPlayer?.name || 'Player';

  // Extract family interests from turns
  const interestTurns = (turns || []).filter(t =>
    t &&
    t.status === 'completed' &&
    t.response &&
    (t.prompt?.toLowerCase().includes('interest') ||
     t.prompt?.toLowerCase().includes('hobby') ||
     t.prompt?.toLowerCase().includes('hobbies') ||
     t.prompt?.toLowerCase().includes('love') ||
     t.prompt?.toLowerCase().includes('favorite'))
  );

  const interestSummary = interestTurns.length > 0
    ? interestTurns.slice(-10).map(t => `${t.playerName || 'Someone'}: ${JSON.stringify(t.response)}`).join('\n')
    : 'No specific interests identified yet - use general pop culture topics';

  return `You are THE QUIZMASTER for Family Glitch's Hard Trivia Challenge.

## MISSION
Generate one challenging multiple-choice trivia question for ${targetName}.

## FAMILY INTERESTS AND HOBBIES
${interestSummary}

## QUESTION RULES
1. Use the interests above if possible. If none, use general pop culture.\n2. Make it hard but fair (not trivial, not obscure).\n3. Provide 4 options: one correct, three plausible wrong.\n4. Keep the question to 1-2 short sentences.\n5. Avoid trick wording.

## OUTPUT FORMAT
Respond with ONLY valid JSON:
{
  \"category\": \"Movies\",
  \"question\": \"Which actor played Jack Dawson in Titanic?\",
  \"options\": [\"Leonardo DiCaprio\", \"Brad Pitt\", \"Tom Cruise\", \"Matt Damon\"],
  \"correct_answer\": \"Leonardo DiCaprio\"
}

CRITICAL: correct_answer must EXACTLY match one option.

Generate the trivia question now.`;
}

/**
 * Build prompt for scoring the player's answer
 */
export function buildHardTriviaScorerPrompt(context: ScorePromptContext): string {
  const { targetPlayer, question, correctAnswer, playerAnswer, options } = context;

  // Defensive null checks
  const targetName = targetPlayer?.name || 'Player';
  const safeQuestion = question || 'The trivia question';
  const safeOptions = options || [];

  return `You are scoring ${targetName}'s answer to a Hard Trivia question.

## QUESTION
${safeQuestion}

## OPTIONS
${safeOptions.map((opt, i) => `${i + 1}. ${opt || 'Option'}`).join('\n') || 'No options provided'}

## CORRECT ANSWER
${correctAnswer || 'Not provided'}

## PLAYER ANSWER
${playerAnswer || 'No answer given'}

## SCORING
- Exact match = 5 points\n- Otherwise = 0 points

## OUTPUT FORMAT
Respond with ONLY valid JSON:
{
  \"correct\": true,
  \"points\": 5,
  \"commentary\": \"Nice! You nailed it.\"
}

OR
{
  \"correct\": false,
  \"points\": 0,
  \"commentary\": \"Ouch, it was actually [correct answer].\"
}

Keep commentary to one short sentence (max 12 words).`;
}
