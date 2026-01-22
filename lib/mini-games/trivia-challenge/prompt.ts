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

**If the answer is complex, extract the CORE FACT:**
- Answer: "I'm obsessed with The Last of Us, but also love Stranger Things and Breaking Bad"
- Extract: "The Last of Us" (the FIRST thing mentioned is usually most important)
- Question: "What show is ${sourceName} currently obsessed with?"

**Make it challenging but fair:**
- If answer is specific (e.g., "Lakers"), ask for that exact thing
- If answer is a list, ask for their TOP choice or favorite
- If answer is about preferences, make it a simple guess

**Good question examples:**
✅ "What show do you think ${sourceName} is obsessed with?"
✅ "Where would ${sourceName} want to travel most?"
✅ "What's ${sourceName}'s go-to coffee order?"
✅ "What food could ${sourceName} eat every day?"

**Bad questions (avoid these):**
❌ "What did ${sourceName} say about..." (implies they heard it)
❌ "Do you remember what ${sourceName} said?" (not a memory test!)
❌ "What was the SECOND thing ${sourceName} listed?" (nobody knows - it was secret!)
❌ "Name all the things ${sourceName} mentioned" (too hard, unfun)

The best questions test if ${targetName} really KNOWS ${sourceName}, not if they memorized details.

## Format

Question phase:
{"phase": "question", "question": "Your question here"}

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

## Scoring Rubric (0-5)

**5 points** - Exact match or clearly correct (shows they really know ${sourceName})
**4 points** - Very close, right idea, minor details off
**3 points** - Partially right, shows some knowledge
**2 points** - Weak connection, mostly wrong but attempted
**1 point** - Completely wrong but creative/funny
**0 points** - Total miss, no connection

**Be generous with partial credit:**
- "Lakers" vs "Los Angeles Lakers" → 5 points (same thing)
- "The Last of Us" vs "some zombie show" → 3-4 points (right idea)
- "Italy" vs "Europe" → 3 points (right region, not specific enough)
- "Pizza" vs "Italian food" → 3 points (same category)

Respond as JSON:
{"phase": "score", "score": <0-5>, "commentary": "<max 10 words>", "correctAnswer": "<the answer>"}

Keep commentary witty and concise.`;
}
