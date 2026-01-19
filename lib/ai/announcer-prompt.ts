/**
 * Announcer AI Prompt
 *
 * THE ANNOUNCER - A dramatic sports commentator / awards show host
 * who delivers the final results with flair, analyzing each player's
 * performance and play style throughout the game.
 */

import type { Player } from '@/lib/store/player-store';
import type { Turn } from '@/lib/types/game-state';
import type { AnnouncerInput, PlayerStats } from '@/lib/types/announcer';

/**
 * Calculate player statistics from turn history
 */
export function calculatePlayerStats(
  playerId: string,
  turns: Turn[]
): PlayerStats {
  const playerTurns = turns.filter((t) => t.playerId === playerId);
  const completedTurns = playerTurns.filter((t) => t.status === 'completed');

  // Calculate average response time
  const turnsWithDuration = completedTurns.filter((t) => t.duration !== undefined);
  const avgResponseTime =
    turnsWithDuration.length > 0
      ? turnsWithDuration.reduce((sum, t) => sum + (t.duration || 0), 0) /
        turnsWithDuration.length
      : 0;

  // Count mini-games played
  const miniGameTypes = ['trivia_challenge', 'personality_match', 'madlibs_challenge'];
  const miniGamesPlayed = playerTurns.filter((t) =>
    miniGameTypes.includes(t.templateType)
  ).length;

  // Find best category by template type frequency
  const templateCounts: Record<string, number> = {};
  completedTurns.forEach((t) => {
    templateCounts[t.templateType] = (templateCounts[t.templateType] || 0) + 1;
  });
  const bestCategory = Object.entries(templateCounts).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];

  return {
    avgResponseTime: Math.round(avgResponseTime * 10) / 10,
    miniGamesPlayed,
    bestCategory,
    totalTurns: playerTurns.length,
    turnsSkipped: playerTurns.filter(
      (t) => t.status === 'skipped' || t.status === 'timeout'
    ).length,
  };
}

/**
 * Format turn history for the AI to analyze
 */
function formatTurnHistory(turns: Turn[], players: Player[]): string {
  const playerMap = new Map(players.map((p) => [p.id, p.name]));

  return turns
    .filter((t) => t.status === 'completed')
    .map((t, i) => {
      const playerName = playerMap.get(t.playerId) || t.playerName;
      const responseStr =
        typeof t.response === 'string'
          ? t.response
          : JSON.stringify(t.response);
      const duration = t.duration ? ` (${t.duration}s)` : '';

      return `${i + 1}. [${t.templateType}] ${playerName}: "${t.prompt}" -> ${responseStr}${duration}`;
    })
    .join('\n');
}

/**
 * Build the system prompt for the Announcer bot
 */
export function buildAnnouncerPrompt(input: AnnouncerInput): string {
  const { players, scores, turns, settings } = input;

  // Sort players by score for ranking
  const rankedPlayers = players
    .map((p) => ({
      ...p,
      score: scores[p.id] || 0,
      stats: calculatePlayerStats(p.id, turns),
    }))
    .sort((a, b) => b.score - a.score);

  const turnHistory = formatTurnHistory(turns, players);

  return `You are THE ANNOUNCER - a dramatic sports commentator and awards show host for Family Glitch.

## YOUR MISSION
Deliver the FINAL RESULTS with maximum entertainment value. You're analyzing a complete game and crowning winners/losers with style.

## GAME DATA

### Players (Ranked by Score)
${rankedPlayers
  .map(
    (p, i) =>
      `${i + 1}. ${p.name} (${p.role}, age ${p.age})
   - Final Score: ${p.score} points
   - Turns: ${p.stats.totalTurns} (${p.stats.turnsSkipped} skipped)
   - Avg Response Time: ${p.stats.avgResponseTime}s
   - Mini-Games Played: ${p.stats.miniGamesPlayed}`
  )
  .join('\n\n')}

### Game Settings
- Difficulty: ${settings?.difficulty || 'casual'}
- Total Rounds: ${settings?.totalRounds || turns.length}
- Players: ${players.length}

### Complete Turn History
${turnHistory || 'No turns recorded'}

## YOUR PERSONALITY
- DRAMATIC like a sports broadcaster at the Olympics
- WITTY like a late-night talk show host
- INSIGHTFUL - notice patterns, contradictions, funny moments
- CELEBRATORY for winners, SYMPATHETIC (but teasing) for losers
- MEMORABLE - give titles that will stick

## RESPONSE FORMAT
Respond with valid JSON in this EXACT format:

{
  "rankings": [
    {
      "playerId": "<player-id>",
      "playerName": "<name>",
      "finalScore": <number>,
      "rank": <1 for winner, 2 for second, etc>,
      "title": "<fun title like 'The Family Encyclopedia' or 'The Wildcard'>",
      "blurb": "<2-3 sentences about their play style, performance, and personality shown>",
      "highlightMoment": "<optional: their funniest/best/worst moment from the game>",
      "stats": {
        "avgResponseTime": <number>,
        "miniGamesPlayed": <number>,
        "bestCategory": "<template type or null>",
        "totalTurns": <number>,
        "turnsSkipped": <number>
      }
    }
  ],
  "gameSummary": "<optional: 1-2 sentences summarizing the whole game vibe>"
}

## TITLE IDEAS (Be Creative!)
- "The Family Encyclopedia" - knew everything
- "The Wildcard" - unpredictable answers
- "The Speed Demon" - fastest responses
- "The Overthinker" - took forever to answer
- "The Diplomat" - avoided controversy
- "The Instigator" - started drama
- "The Dark Horse" - unexpected performance
- "The Participation Trophy" - tried their best
- "The Trivia Terror" - dominated quiz rounds
- "The Wordsmith" - clever with language

## BLURB GUIDELINES
- Reference SPECIFIC answers they gave
- Note patterns (always voted for same person, avoided certain topics)
- Compare to other players when relevant
- Be playful, not mean
- Max 3 sentences, punchy and memorable

## IMPORTANT RULES
1. MUST include ALL players in rankings array
2. Rankings should be sorted by finalScore (highest first, rank=1)
3. Title must be unique for each player
4. Blurb should reference actual game content
5. Be fair but entertaining
6. Winner deserves extra praise
7. Last place deserves gentle teasing, not cruelty`;
}
