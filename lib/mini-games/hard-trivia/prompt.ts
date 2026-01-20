/**
 * Hard Trivia Challenge - AI Prompts
 *
 * Generates challenging trivia questions based on family interests/hobbies
 * collected during gameplay.
 */

import type { Turn } from '@/lib/types/game-state';
import type { Player } from '@/lib/store/player-store';

export interface GeneratePromptContext {
  targetPlayer: Player;
  allPlayers: Player[];
  turns: Turn[];
}

export interface ScorePromptContext {
  targetPlayer: Player;
  question: string;
  correctAnswer: string;
  playerAnswer: string;
  options: string[];
}

/**
 * Build prompt for generating hard trivia questions
 */
export function buildHardTriviaGeneratorPrompt(context: GeneratePromptContext): string {
  const { targetPlayer, allPlayers, turns } = context;

  // Extract family interests from turns
  const interestTurns = turns.filter(t =>
    t.status === 'completed' &&
    t.response &&
    (t.prompt?.toLowerCase().includes('interest') ||
     t.prompt?.toLowerCase().includes('hobby') ||
     t.prompt?.toLowerCase().includes('hobbies') ||
     t.prompt?.toLowerCase().includes('love') ||
     t.prompt?.toLowerCase().includes('favorite'))
  );

  const interestSummary = interestTurns.length > 0
    ? interestTurns.slice(-10).map(t => `${t.playerName}: ${JSON.stringify(t.response)}`).join('\n')
    : 'No specific interests identified yet - use general pop culture topics';

  return `You are THE QUIZMASTER for Family Glitch's Hard Trivia Challenge.

## YOUR MISSION
Generate a challenging trivia question for ${targetPlayer.name} based on topics this family is interested in.

## FAMILY INTERESTS & HOBBIES
${interestSummary}

## TRIVIA QUESTION RULES
1. **Pick a topic** from the family's interests above (movies, sports, music, games, cooking, etc.)
2. **Make it HARD** - not trivial, but not impossible
3. **Create 4 multiple choice options** - one correct, three plausible wrong answers
4. **Shuffle the options** - correct answer should NOT always be in the same position

## DIFFICULTY GUIDELINES
- **Good**: "Which actor played Jack in Titanic?" (if family loves movies)
- **Good**: "What year did the Beatles release Abbey Road?" (if family loves classic rock)
- **Good**: "How many rings does Saturn have?" (if family loves science)
- **Too Easy**: "What color is the sky?"
- **Too Hard**: "What was Beethoven's middle name?"

## OUTPUT FORMAT
You MUST respond with ONLY valid JSON in this exact format:

{
  "category": "Movies",
  "question": "Which actor played Jack Dawson in Titanic?",
  "options": ["Leonardo DiCaprio", "Brad Pitt", "Tom Cruise", "Matt Damon"],
  "correct_answer": "Leonardo DiCaprio"
}

CRITICAL: The "correct_answer" must be an EXACT MATCH to one of the options.

Generate the trivia question now as JSON:`;
}

/**
 * Build prompt for scoring the player's answer
 */
export function buildHardTriviaScorerPrompt(context: ScorePromptContext): string {
  const { targetPlayer, question, correctAnswer, playerAnswer, options } = context;

  return `You are scoring ${targetPlayer.name}'s answer to a Hard Trivia question.

## THE QUESTION
${question}

## THE OPTIONS
${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}

## CORRECT ANSWER
${correctAnswer}

## PLAYER'S ANSWER
${playerAnswer}

## SCORING RULES
- If the player's answer matches the correct answer → they got it RIGHT → 10 points
- If the player's answer does NOT match the correct answer → they got it WRONG → 0 points

## OUTPUT FORMAT
Respond with ONLY valid JSON in this exact format:

{
  "correct": true,
  "points": 10,
  "commentary": "Nice! You nailed it."
}

OR

{
  "correct": false,
  "points": 0,
  "commentary": "Ouch, it was actually [correct answer]."
}

Keep commentary to ONE SHORT SENTENCE (max 12 words).

Score the answer now as JSON:`;
}
