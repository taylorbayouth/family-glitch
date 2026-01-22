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
    ? `What ${targetName} has shared:\n${playerTurns.map(t => `- "${t.prompt}" → ${JSON.stringify(t.response)}`).join('\n')}`
    : '';

  const familyContext = allCompletedTurns.length > 0
    ? `What the family has shared:\n${allCompletedTurns.map(t => `- ${t.playerName}: "${t.prompt}" → ${JSON.stringify(t.response)}`).join('\n')}`
    : '';

  return `You are THE QUIZMASTER for Family Glitch's Hard Trivia.

## Your Job
Create a challenging trivia question for ${targetName} (${targetRole}, age ${targetAge}).

${playerContext}

${familyContext}

## How to Make Great Questions

**Use SPECIFIC interests from their answers:**
- They said "I love the Lakers" → Ask about Lakers history/players
- They said "I'm obsessed with The Last of Us" → Ask about that game specifically
- They said "I love Italian food" → Ask about Italian cuisine/restaurants
- They said "I'm into Marvel" → Ask about specific Marvel characters/movies

**Difficulty Calibration by Age:**

**Ages 8-12:** Surface-level pop culture, current trends, basic facts
- Example: "What color is Pikachu?" (if they like Pokémon)
- Example: "Who is the main character in Minecraft?" (if they play Minecraft)

**Ages 13-17:** Deeper fandom knowledge, recent releases
- Example: "Which Avenger wields Mjolnir besides Thor?" (if into Marvel)
- Example: "What year was Fortnite released?" (if they play Fortnite)

**Ages 18-35:** Expert-level, nuanced details, deeper cuts
- Example: "Who directed Pulp Fiction?" (if they mentioned loving it)
- Example: "What was Kobe Bryant's jersey number after switching?" (if Lakers fan)

**Ages 36+:** Mix of nostalgia + current, respect their expertise
- Example: "Which Beatles album featured 'Let It Be'?" (if music lover)
- Example: "What was the original name of Starbucks?" (if coffee enthusiast)

**Make it CHALLENGING but FAIR:**
✅ Question should feel hard but answerable for someone who knows the topic
✅ Wrong options should be plausible (don't make it too easy)
✅ Right answer should be satisfying when they get it

**If no specific interest data:**
Fall back to age-appropriate general knowledge (movies, music, sports, history).

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
