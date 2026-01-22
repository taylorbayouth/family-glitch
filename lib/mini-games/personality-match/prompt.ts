/**
 * Personality Match AI Prompt
 *
 * The Analyst is a separate AI personality that:
 * - Scores how well selected words match a player's personality
 * - Uses previous turn data to understand who the player really is
 * - Provides witty commentary on selections
 */

import type { Turn } from '@/lib/types/game-state';
import type { MiniGameResult } from '../types';

interface WordGeneratorContext {
  subjectPlayerName: string;
  subjectPlayerRole?: string;
  subjectPlayerAge?: number;
  relevantTurns: Turn[];
  allPlayers: Array<{ id: string; name: string; role?: string; age?: number }>;
}

/**
 * Build prompt for AI to generate personality words for the grid
 */
export function buildPersonalityWordGeneratorPrompt(context: WordGeneratorContext): string {
  const { subjectPlayerName, subjectPlayerRole, subjectPlayerAge, relevantTurns } = context;

  // Defensive null checks
  const subjectName = subjectPlayerName || 'Player';
  const safeTurns = (relevantTurns || []).filter(t => t && t.playerName);
  const turnsSummary = safeTurns.map((t, i) => {
    const responseStr = typeof t.response === 'string'
      ? t.response
      : JSON.stringify(t.response, null, 2);
    return `${i + 1}. ${t.playerName || 'Someone'} was asked: "${t.prompt || 'a question'}"
   Response: ${responseStr}`;
  }).join('\n\n');

  return `You are THE ANALYST - generating personality words for a Family Glitch challenge.

## MISSION
Generate exactly 16 personality words for a 4x4 grid about ${subjectName}${subjectPlayerRole ? ` (${subjectPlayerRole}` : ''}${subjectPlayerAge ? `, age ${subjectPlayerAge})` : subjectPlayerRole ? ')' : ''}.

## WHAT WE KNOW ABOUT ${subjectName.toUpperCase()}
${turnsSummary || 'No specific game data yet - use general personality words.'}

## WORD RULES

**Structure (exactly 16 words):**
- 4 STRONG FITS - clear evidence supports these
- 4 CLEAR DECOYS - obviously don't match based on evidence
- 8 DEBATABLE - could go either way, spark discussion

**Quality standards:**
✅ Single-word traits only (no phrases)
✅ Mix positive, negative, and neutral
✅ Based on EVIDENCE, not stereotypes (don't assume based on age/role)
✅ Engaging vocabulary - avoid jargon but respect intelligence
✅ No names, no repeats

**Make it CHALLENGING:**
- Don't make the strong fits too obvious
- Debatable words should genuinely be arguable
- Decoys should be tempting but clearly wrong
- Use specific traits, not generic ones ("adventurous" > "nice")

**Examples of good word sets:**
Person who said "I love hiking and travel":
- Strong fits: adventurous, outdoorsy, spontaneous, curious
- Debatable: introverted, athletic, independent, practical
- Decoys: sedentary, homebody, cautious, rigid

## RESPONSE FORMAT
Respond with valid JSON:
{
  "words": ["word1", "word2", ... exactly 16 words]
}

The best grids make families debate and laugh together!`;
}

export interface PersonalityWordGeneratorResponse {
  words: string[];
}

/**
 * Parse AI response for generated words
 */
export function parsePersonalityWordGeneratorResponse(text: string): PersonalityWordGeneratorResponse | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsed.words) || parsed.words.length < 16) {
      return null;
    }

    // Ensure we have exactly 16 words
    return {
      words: parsed.words.slice(0, 16).map((w: string) => String(w).trim()),
    };
  } catch {
    return null;
  }
}

/**
 * Get turns related to a specific player (turns about them or by them)
 */
export function getTurnsAboutPlayer(turns: Turn[], playerId: string, playerName: string): Turn[] {
  return (turns || []).filter(t => {
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
  const { subjectPlayerName, selectedWords, relevantTurns } = context;

  // Defensive null checks
  const subjectName = subjectPlayerName || 'Player';
  const safeSelectedWords = selectedWords || [];
  const safeTurns = (relevantTurns || []).filter(t => t && t.playerName);
  // Format relevant turns for AI context
  const turnsSummary = safeTurns.map((t, i) => {
    const responseStr = typeof t.response === 'string'
      ? t.response
      : JSON.stringify(t.response, null, 2);
    return `${i + 1}. ${t.playerName || 'Someone'} was asked: "${t.prompt || 'a question'}"
   Response: ${responseStr}`;
  }).join('\n\n');

  return `You are THE ANALYST - a perceptive, witty personality judge for Family Glitch.

## MISSION
Score how well the selected words match ${subjectName} based on game evidence.

## WHAT WAS SELECTED
${safeSelectedWords.map(w => `- ${w || 'word'}`).join('\n') || '- No words selected'}

## EVIDENCE
${turnsSummary || 'No specific data yet - use a cautious, general read.'}

## SCORING RUBRIC (0-5)

**5 points** - Nailed it! Selected words perfectly capture ${subjectName} based on evidence
**4 points** - Strong read, mostly accurate with minor misses
**3 points** - Mixed bag, some hits and some misses
**2 points** - Weak understanding, more wrong than right
**1 point** - Mostly wrong, picked obvious decoys
**0 points** - Completely off, random selections

**Score based on EVIDENCE, not vibes:**
- If they said "I love hiking" and player picked "adventurous, outdoorsy" → strong evidence
- If they said "I'm a homebody" and player picked "outgoing, spontaneous" → contradicts evidence
- Reward choices backed by concrete answers
- Penalize choices that contradict what ${subjectName} revealed

**Be tough but fair:**
- Don't give 5s for just picking positive words
- Don't give 0s unless selections are wildly off
- 3 is the "didn't really know them" score

## RESPONSE FORMAT
Respond with valid JSON:
{
  "score": <0-5>,
  "commentary": "<max 10 words, witty and insightful>",
  "bestPick": "<most accurate word they selected>",
  "worstPick": "<least accurate word, if any>",
  "insight": "<optional one-line insight about their read>"
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
