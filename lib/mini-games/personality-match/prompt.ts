/**
 * Personality Match AI Prompt
 *
 * The Analyst is a separate AI personality that:
 * - Scores how well selected words match a player's personality
 * - Uses previous turn data to understand who the player really is
 * - Provides witty commentary on selections
 */

import type { Turn } from '@/lib/types/game-state';
import type { PersonalityMatchContext, MiniGameResult } from '../types';

// Default personality words - can be expanded or customized
export const DEFAULT_PERSONALITY_WORDS = [
  'Adventurous', 'Anxious', 'Calm', 'Chaotic',
  'Creative', 'Cautious', 'Direct', 'Dramatic',
  'Easygoing', 'Energetic', 'Funny', 'Grumpy',
  'Helpful', 'Honest', 'Impulsive', 'Independent',
  'Introverted', 'Kind', 'Loud', 'Moody',
  'Organized', 'Outgoing', 'Patient', 'Perfectionist',
  'Practical', 'Sarcastic', 'Sensitive', 'Stubborn',
  'Thoughtful', 'Unpredictable', 'Witty', 'Worrier',
];

/**
 * Select a random subset of words for the grid
 */
export function selectWordsForGrid(count: number = 16): string[] {
  const shuffled = [...DEFAULT_PERSONALITY_WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get turns related to a specific player (turns about them or by them)
 */
export function getTurnsAboutPlayer(turns: Turn[], playerId: string, playerName: string): Turn[] {
  return turns.filter(t => {
    // Turns where this player responded
    if (t.playerId === playerId && t.status === 'completed') return true;

    // Turns where this player was mentioned/voted for
    if (t.response) {
      const responseStr = JSON.stringify(t.response).toLowerCase();
      if (responseStr.includes(playerName.toLowerCase())) return true;
      if (responseStr.includes(playerId)) return true;
    }

    return false;
  });
}

interface ScoringPromptContext {
  subjectPlayerName: string;
  selectedWords: string[];
  relevantTurns: Turn[];
  allPlayers: Array<{ id: string; name: string; role?: string }>;
  scores: Record<string, number>;
}

/**
 * Build the system prompt for the Personality Match scorer
 */
export function buildPersonalityMatchPrompt(context: ScoringPromptContext): string {
  const { subjectPlayerName, selectedWords, relevantTurns, allPlayers, scores } = context;

  // Format relevant turns for AI context
  const turnsSummary = relevantTurns.slice(-5).map((t, i) => {
    const responseStr = typeof t.response === 'string'
      ? t.response
      : JSON.stringify(t.response, null, 2);
    return `${i + 1}. ${t.playerName} was asked: "${t.prompt}"
   Response: ${responseStr}`;
  }).join('\n\n');

  return `You are THE ANALYST - a perceptive, witty personality judge for Family Glitch.

## YOUR MISSION
Score how well the selected personality words match ${subjectPlayerName} based on what you've learned from the game.

## WHAT WAS SELECTED
The player chose these words to describe ${subjectPlayerName}:
${selectedWords.map(w => `- ${w}`).join('\n')}

## EVIDENCE FROM THE GAME
Here's what we know about ${subjectPlayerName} from previous turns:
${turnsSummary || 'No specific data yet - judge based on general impression.'}

## CURRENT GAME STATE
Players: ${allPlayers.map((p) => `${p.name}${p.role ? ` (${p.role})` : ''}`).join(', ')}
Scores: ${Object.entries(scores)
    .map(([id, score]) => {
      const player = allPlayers.find((p) => p.id === id);
      return player ? `${player.name}: ${score}` : null;
    })
    .filter(Boolean)
    .join(', ') || 'Starting fresh'}

## SCORING RULES (0-5 points)
- **5 points**: Exceptional match - words perfectly capture their personality with insight
- **4 points**: Strong match - most words are spot-on, shows they know the person
- **3 points**: Decent match - some good picks, some misses
- **2 points**: Weak match - only a couple words fit
- **1 point**: Poor match - mostly wrong but showed effort
- **0 points**: Complete miss or random guessing

## YOUR PERSONALITY
- Insightful and analytical
- Playfully call out obvious misses
- Praise genuinely good reads
- Keep commentary to MAX 10 WORDS - one killer observation only

## RESPONSE FORMAT
Respond with valid JSON:
{
  "score": <0-5>,
  "commentary": "<your witty reaction - MAX 10 WORDS>",
  "bestPick": "<the most accurate word they chose>",
  "worstPick": "<the least accurate word, if any>",
  "insight": "<optional one-line insight about the subject>"
}`;
}

export interface PersonalityMatchScoreResponse {
  score: number;
  commentary: string;
  bestPick?: string;
  worstPick?: string;
  insight?: string;
}

/**
 * Parse the AI's scoring response
 */
export function parsePersonalityMatchResponse(text: string): PersonalityMatchScoreResponse | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (typeof parsed.score !== 'number' || !parsed.commentary) {
      return null;
    }

    return {
      score: Math.min(5, Math.max(0, parsed.score)),
      commentary: parsed.commentary,
      bestPick: parsed.bestPick,
      worstPick: parsed.worstPick,
      insight: parsed.insight,
    };
  } catch {
    return null;
  }
}

/**
 * Convert AI response to standard MiniGameResult
 */
export function toMiniGameResult(response: PersonalityMatchScoreResponse): MiniGameResult {
  const parts = [response.commentary];
  if (response.insight) parts.push(response.insight);

  return {
    score: response.score,
    maxScore: 5,
    commentary: response.commentary,
    correctAnswer: response.bestPick
      ? `Best pick: ${response.bestPick}${response.worstPick ? `, Worst: ${response.worstPick}` : ''}`
      : undefined,
    bonusInfo: response.insight,
  };
}
