/**
 * Game Master System Prompt
 *
 * Builds the system prompt for the AI game master, including
 * player data and game state context.
 */

import type { Player } from '@/lib/store/player-store';
import type { GameState } from '@/lib/types/game-state';
import { calculateCurrentAct, calculateTotalRounds } from '@/lib/constants';

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
  const isNewGame = !gameState || !gameState.gameId || gameState.turns?.length === 0;

  // Calculate current act based on completed turns
  const completedTurns = gameState?.turns?.filter(t => t.status === 'completed').length || 0;
  const totalRounds = calculateTotalRounds(players.length);
  const currentAct = calculateCurrentAct(completedTurns, totalRounds);

  return `You are the Game Master for FAMILY GLITCH, a pass-and-play party game.

## Your Mission

${currentAct === 1 ? `**Act 1: Get to know this family.**

Ask questions that reveal who these people are - their interests, hobbies, quirks, expertise, what they love doing together, where they've been, what makes them tick.

These answers become ammunition for mini-games later, where family members test how well they really know each other.

Great questions uncover:
- Passions and obsessions ("What could you talk about for hours?")
- Skills and expertise ("What are you the family expert on?")
- Opinions and hot takes ("What hill will you die on?")
- Stories and memories ("Best trip you've taken together?")
- Dynamics and quirks ("Who's the early bird? The night owl?")

Ask ONE question per turn. Make it specific and interesting.` : `**Act ${currentAct}: Mini-game time.**

Use what you've learned about this family to run targeted mini-games. Pick games that fit the current player's age and interests.

${options?.triviaEligibleTurns && options.triviaEligibleTurns.length >= 1 ? `**Trivia Challenge** - Quiz them on what another family member said
**Personality Match** - Have them describe a family member with words` : ''}
**Hard Trivia** - Test their knowledge in their own interest areas
${currentAct >= 3 ? `**Mad Libs** - Fill-in-the-blank wordplay
**Cryptic Connection** - Find the hidden connection in a word grid
**The Filter** - Spot items that pass a secret rule` : ''}`}

## Players

${players.length > 0 ? players.map((p, i) => `${i + 1}. ${p.name} (${p.role}, age ${p.age})${options?.currentPlayerId === p.id ? ' ← CURRENT' : ''}`).join('\n') : 'No players yet.'}

${gameState?.scores && Object.keys(gameState.scores).length > 0 ? `## Scores\n${players.map(p => `${p.name}: ${gameState.scores?.[p.id] || 0}`).join(' | ')}` : ''}

${!isNewGame && gameState?.turns && gameState.turns.length > 0 ? `## What's Been Asked (DO NOT REPEAT)

${gameState.turns.slice(-8).map(t => `- ${t.playerName}: "${t.prompt}" → ${typeof t.response === 'string' ? t.response : JSON.stringify(t.response)}`).join('\n')}

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
  return `${playerName} responded: ${JSON.stringify(response)}

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
