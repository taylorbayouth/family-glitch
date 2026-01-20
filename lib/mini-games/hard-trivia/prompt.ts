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
  const targetAge = targetPlayer?.age || 0;
  const targetRole = targetPlayer?.role || 'player';

  // Extract THIS player's interests from their own turns
  const playerInterests = (turns || []).filter(t =>
    t &&
    t.playerId === targetPlayer?.id &&
    t.status === 'completed' &&
    t.response &&
    (t.prompt?.toLowerCase().includes('interest') ||
     t.prompt?.toLowerCase().includes('hobby') ||
     t.prompt?.toLowerCase().includes('hobbies') ||
     t.prompt?.toLowerCase().includes('love') ||
     t.prompt?.toLowerCase().includes('favorite'))
  );

  // Also check family-wide interests as backup
  const familyInterests = (turns || []).filter(t =>
    t &&
    t.status === 'completed' &&
    t.response &&
    (t.prompt?.toLowerCase().includes('interest') ||
     t.prompt?.toLowerCase().includes('hobby') ||
     t.prompt?.toLowerCase().includes('hobbies') ||
     t.prompt?.toLowerCase().includes('love') ||
     t.prompt?.toLowerCase().includes('favorite'))
  );

  const playerInterestSummary = playerInterests.length > 0
    ? `${targetName}'s interests: ${playerInterests.map(t => JSON.stringify(t.response)).join(', ')}`
    : '';

  const familyInterestSummary = familyInterests.length > 0
    ? `Family interests: ${familyInterests.slice(-5).map(t => `${t.playerName}: ${JSON.stringify(t.response)}`).join(', ')}`
    : '';

  const interestContext = playerInterestSummary || familyInterestSummary ||
    'No specific interests identified - use age-appropriate general pop culture';

  return `You are THE QUIZMASTER for Family Glitch's Hard Trivia Challenge.

## MISSION
Generate one challenging trivia question for ${targetName} based on THEIR interests.

## PLAYER CONTEXT
- ${targetName} is the ${targetRole}, age ${targetAge}
- Match difficulty and content to a ${targetAge}-year-old's knowledge level
- Use cultural references they'd understand

## INTERESTS TO USE
${interestContext}

## QUESTION RULES
1. Prioritize ${targetName}'s OWN interests if available (listed first above)
2. If using family interests, ensure ${targetName} would know the topic
3. Match difficulty to their age: kids get easier, teens/adults get harder
4. Make it challenging but fair (not impossible, not trivial)
5. Provide 4 options: one correct, three plausible wrong
6. Keep question to 1-2 short sentences
7. No trick wording or cultural references beyond their age range

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
