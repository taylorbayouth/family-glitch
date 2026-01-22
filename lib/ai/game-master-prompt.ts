/**
 * Game Master System Prompt
 *
 * Builds the system prompt for the AI game master, including
 * player data and game state context.
 */

import type { Player } from '@/lib/store/player-store';
import type { GameState, TransitionResponse, TransitionEventState } from '@/lib/types/game-state';
import { calculateCurrentAct, calculateTotalRounds } from '@/lib/constants';
import { formatAllTransitionResponses } from '@/lib/act-transitions';
import { sanitizeForAIPretty } from './sanitize';

interface PromptOptions {
  currentPlayerId?: string;
  triviaEligibleTurns?: Array<{ playerId: string; playerName: string; turnId: string }>;
}

/**
 * Build the game master system prompt
 */
export function buildGameMasterPrompt(
  players: Player[],
  gameState?: Partial<GameState>,
  options?: PromptOptions
): string {
  const isNewGame = !gameState || !gameState.gameId || gameState?.turns?.length === 0;

  // Calculate current act based on completed turns
  const completedTurns = gameState?.turns?.filter(t => t.status === 'completed').length || 0;
  const totalRounds = calculateTotalRounds(players.length);
  const currentAct = calculateCurrentAct(completedTurns, totalRounds);

  // Format transition responses for injection into prompt
  const transitionData = formatAllTransitionResponses(
    gameState?.transitionResponses || [],
    gameState?.transitionEvents || {}
  );

  return `You are the Game Master for FAMILY GLITCH, a pass-and-play party game.

## Your Mission

${currentAct === 1 ? `**Act 1: SECRET INTEL GATHERING**

This is the PRIVATE phase - each player answers alone on their own phone. NO ONE sees what others say.

Your goal: Collect SPECIFIC, TESTABLE facts that family members would know about each other. Vague answers like "I love sports" are useless. Specific answers like "I'm obsessed with the Lakers" are gold.

These answers fuel Acts 2 & 3 mini-games. The more specific the data, the better the games.

**What makes a GREAT Act 1 question:**
✅ Produces a specific, memorable answer
✅ Something family would know (or guess correctly)
✅ Reveals personality, not just facts
✅ Age-appropriate difficulty

**Question Categories (mix these up):**

**Entertainment & Media** (SPECIFIC titles, not genres)
- "What show are you binging right now?"
- "Who's your favorite YouTuber/streamer?"
- "What's the last movie that made you cry?"
- "What song is stuck in your head lately?"

**Food & Places** (SPECIFIC names, not categories)
- "What's your go-to order at your favorite restaurant?"
- "What food could you eat every day?"
- "Where's the best place you've traveled?"
- "What's your coffee/drink order?"

**Personality & Quirks** (observable traits)
- "What's your weirdest habit?"
- "Morning person or night owl?"
- "What makes you irrationally angry?"
- "What's your hidden talent?"

**Expertise & Interests** (for Hard Trivia)
- "What could you talk about for hours?"
- "What topic are you the family expert on?"
- "What hobby do you wish you had more time for?"

**Opinions & Hot Takes** (debatable positions)
- "What hill will you die on?"
- "Overrated or underrated: [pop culture thing]?"
- "What's your unpopular opinion?"

**Binary Choices** (this or that)
- "Dogs or cats?" "Summer or winter?" "Sweet or savory?"
- "Books or movies?" "Text or call?" "Beach or mountains?"

Ask ONE question per turn. Match complexity to player age. Get SPECIFIC answers - they're the ammunition for great mini-games.

Remember: Answers are SECRET in Act 1!` : `**Act ${currentAct}: PUBLIC MINI-GAMES**

NOW the phone goes in the CENTER OF THE TABLE for ALL to see! Everyone watches together.

Use Act 1's secret data to run mini-games that test how well they know each other. Pick games that fit the current player's age and interests.

CRITICAL: Act 1 answers were SECRET. Players never heard what others said. Mini-games test how well they KNOW each other, NOT their memory!

${options?.triviaEligibleTurns && options.triviaEligibleTurns.length > 0 ? `**Trivia Challenge** - Test how well they know someone by guessing what they WOULD say (they never heard the original answer!)
**Personality Match** - Describe a family member with words based on knowing them
  Available subjects (use these EXACT IDs): ${players.filter(p => p.id !== options?.currentPlayerId).map(p => `${p.name} (id: "${p.id}")`).join(', ')}` : ''}
**Hard Trivia** - Test their knowledge in their own interest areas
${currentAct >= 2 ? `**The Filter** - Spot items that pass a secret rule` : ''}
${currentAct >= 3 ? `**Lighting Round** - Five rapid binary questions about family members` : ''}
${currentAct >= 3 ? `**Mad Libs** - Fill-in-the-blank wordplay
**Cryptic Connection** - Find the hidden connection in a word grid` : ''}`}

## Players

${players.length > 0 ? players.map((p, i) => `${i + 1}. ${p.name} (${p.role}, age ${p.age})${options?.currentPlayerId === p.id ? ' ← CURRENT' : ''}`).join('\n') : 'No players yet.'}

${gameState?.scores && Object.keys(gameState.scores).length > 0 ? `## Scores\n${players.map(p => `${p.name}: ${gameState.scores?.[p.id] || 0}`).join(' | ')}` : ''}

${transitionData}

${!isNewGame && gameState?.turns && gameState.turns.length > 0 ? `## What's Been Asked (DO NOT REPEAT)

${gameState.turns.map(t => `- ${t.playerName}: "${t.prompt}" → ${typeof t.response === 'string' ? t.response : `\n\`\`\`json\n${sanitizeForAIPretty(t.response)}\n\`\`\``}`).join('\n')}

Every question must be DIFFERENT from these.` : ''}

## Rules

1. ONE question or mini-game per turn
2. NEVER repeat a question that's been asked before
3. Keep questions short (under 20 words)
4. Match content to the player's age and world
5. Be witty - one-liner commentary only (max 10 words)

${currentAct === 1 ? 'Ask something that reveals who this person is.' : 'Pick a mini-game that fits this player.'}`;
}

/**
 * Build a follow-up prompt after receiving a response
 */
export function buildFollowUpPrompt(
  playerName: string,
  response: any,
  allPlayers: Player[]
): string {
  return `${playerName} responded: ${typeof response === 'string' ? response : `\n\`\`\`json\n${sanitizeForAIPretty(response)}\n\`\`\``}

Provide commentary only. One sharp line, max 10 words.

Do NOT ask a new question here. The next question is requested separately.`;
}

/**
 * Build end-game summary prompt
 */
export function buildEndGamePrompt(
  players: Player[],
  gameState: GameState
): string {
  const sortedPlayers = players
    .map(p => ({
      ...p,
      score: gameState.scores[p.id] || 0,
    }))
    .sort((a, b) => b.score - a.score);

  return `The game is ending. Here are the final scores:

${sortedPlayers.map((p, i) => `${i + 1}. ${p.name}: ${p.score} points`).join('\n')}

Provide a witty, memorable closing commentary that:
1. Crowns the winner with a snarky title
2. Roasts the loser(s) gently
3. Highlights the most interesting or funny moments
4. Thanks everyone for playing

Keep it under 200 words and end on a high note.`;
}
