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
  const turnsSummary = safeTurns.slice(-5).map((t, i) => {
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
1. EXACTLY 16 words, single-word traits only
2. Mix positive, negative, and neutral
3. Include at least 4 strong fits based on evidence above
4. Include 4 clear decoys that do NOT fit
5. The rest should be plausible but debatable
6. Use age-appropriate vocabulary - keep it family-friendly and understandable to all ages
7. No names, no phrases, no repeats

## RESPONSE FORMAT
Respond with valid JSON:
{
  "words": ["word1", "word2", ... exactly 16 words]
}

Make the choices fun and arguable so the family debates them together.`;
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
  const turnsSummary = safeTurns.slice(-5).map((t, i) => {
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

## SCORING RULES (0-5)
5 = nails it\n4 = strong\n3 = mixed\n2 = weak\n1 = mostly wrong\n0 = random

## TONE
- Insightful and witty\n- Call out obvious misses\n- Max 10 words for commentary

## RESPONSE FORMAT
Respond with valid JSON:
{
  "score": <0-5>,
  "commentary": "<max 10 words>",
  "bestPick": "<most accurate word>",
  "worstPick": "<least accurate word, if any>",
  "insight": "<optional one-line insight>"
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
