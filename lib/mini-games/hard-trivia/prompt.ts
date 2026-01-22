/**
 * Hard Trivia Challenge - AI Prompts
 *
 * Generates challenging trivia questions based on the player's
 * own interests and hobbies collected during the game.
 */

import type { Turn, TransitionResponse } from '@/lib/types/game-state';
import type { MiniGamePlayer } from '../registry';

export interface PriorHardTriviaQuestion {
  question: string;
  category: string;
  playerId: string;
  playerName: string;
}

export interface GeneratePromptContext {
  targetPlayer: MiniGamePlayer;
  allPlayers: MiniGamePlayer[];
  turns: Turn[];
  transitionResponses?: TransitionResponse[];
  scores: Record<string, number>;
  priorHardTriviaQuestions: PriorHardTriviaQuestion[];
  allMiniGamesPlayed: Array<{ type: string; playerId: string; playerName: string }>;
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
  const { targetPlayer, allPlayers, turns, transitionResponses, scores, priorHardTriviaQuestions, allMiniGamesPlayed } = context;

  const targetName = targetPlayer?.name || 'Player';
  const targetAge = targetPlayer?.age || 0;
  const targetRole = targetPlayer?.role || 'player';

  // Player list with full details
  const playerList = (allPlayers || [])
    .map(
      (player) =>
        `- ${player.name} (id: "${player.id}", role: ${player.role || 'player'}, age: ${player.age || 'unknown'})`
    )
    .join('\n');

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

  // Prior hard trivia questions to avoid repeats
  const priorQuestionsBlock = priorHardTriviaQuestions.length > 0
    ? `ALREADY ASKED (DO NOT REPEAT OR REPHRASE):\n${priorHardTriviaQuestions.map(q => `- [${q.category}] "${q.question}" (asked to ${q.playerName})`).join('\n')}`
    : 'No prior Hard Trivia questions yet.';

  // All mini-games played for variety tracking
  const miniGamesPlayedBlock = allMiniGamesPlayed.length > 0
    ? `Mini-games played this session:\n${allMiniGamesPlayed.map(g => `- ${g.type} (${g.playerName})`).join('\n')}`
    : 'No prior mini-games yet.';

  // Transition responses (insight collection)
  const transitionResponsesBlock = (transitionResponses || []).length > 0
    ? `Insight collection responses:\n${JSON.stringify(transitionResponses, null, 2)}`
    : '';

  return `You are THE QUIZMASTER for Family Glitch's Hard Trivia.

CURRENT GAME: hard_trivia
This is a trivia mini-game. Vary your questions across different categories and topics.

## Your Job
Create a UNIQUE challenging trivia question for ${targetName} (${targetRole}, age ${targetAge}).

Players:
${playerList || 'No players listed.'}

Current scores:
${JSON.stringify(scores || {}, null, 2)}

${playerContext}

${familyContext}

## FULL GAME DATA (Use for personalization)
${familyContext}

${transitionResponsesBlock}

## CRITICAL: NO REPEATS
${priorQuestionsBlock}

${miniGamesPlayedBlock}

## UNIQUENESS RULES (MANDATORY)
1. NEVER repeat a question that was already asked (check the list above)
2. NEVER ask a similar question with different wording
3. NEVER ask about the same topic/subject twice
4. Each question MUST be about a DIFFERENT category or topic
5. If you've asked about movies, ask about music, sports, science, history, etc.
6. Vary the STYLE: some factual, some "who said/did X", some dates, some names

## How to Make Great Questions

**Use SPECIFIC interests from their answers:**
- They said "I love the Lakers" → Ask about Lakers history/players
- They said "I'm obsessed with The Last of Us" → Ask about that game specifically
- They said "I love Italian food" → Ask about Italian cuisine/restaurants
- They said "I'm into Marvel" → Ask about specific Marvel characters/movies

**Difficulty Calibration by Age:**

**Ages 8-12:** Surface-level pop culture, current trends, basic facts
**Ages 13-17:** Deeper fandom knowledge, recent releases
**Ages 18-35:** Expert-level, nuanced details, deeper cuts
**Ages 36+:** Mix of nostalgia + current, respect their expertise

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
One question, four options, one clear answer.
REMEMBER: This question MUST be completely different from all prior questions!`;
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

/**
 * Extract prior Hard Trivia questions from turns
 */
export function getPriorHardTriviaQuestions(turns: Turn[]): PriorHardTriviaQuestion[] {
  return (turns || [])
    .filter((turn) => turn?.templateType === 'hard_trivia' && turn.response)
    .map((turn) => {
      const response = turn.response as Record<string, any>;
      return {
        question: response?.question || '',
        category: response?.category || 'General',
        playerId: turn.playerId,
        playerName: turn.playerName,
      };
    })
    .filter((q) => q.question);
}

/**
 * Extract all mini-games played from turns
 */
export function getAllMiniGamesPlayed(turns: Turn[]): Array<{ type: string; playerId: string; playerName: string }> {
  const miniGameTypes = [
    'hard_trivia',
    'trivia_challenge',
    'lighting_round',
    'personality_match',
    'the_filter',
    'cryptic_connection',
    'madlibs_challenge',
  ];

  return (turns || [])
    .filter((turn) => turn && miniGameTypes.includes(turn.templateType) && turn.status === 'completed')
    .map((turn) => ({
      type: turn.templateType,
      playerId: turn.playerId,
      playerName: turn.playerName,
    }));
}
