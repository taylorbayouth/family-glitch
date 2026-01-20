/**
 * Cryptic Connection AI Prompts
 *
 * The Riddler is a cryptic puzzle master that:
 * - Generates vague, enigmatic clues
 * - Creates 25 words where some secretly connect to the clue
 * - Scores players with fuzzy logic on their word selections
 */

import type { MiniGameResult } from '../types';

interface GeneratePromptContext {
  targetPlayerName: string;
  allPlayers: Array<{ id: string; name: string; role?: string }>;
  scores: Record<string, number>;
}

/**
 * Build the system prompt for generating a cryptic puzzle
 */
export function buildCrypticGeneratorPrompt(context: GeneratePromptContext): string {
  const { targetPlayerName } = context;

  // Defensive null checks
  const targetName = targetPlayerName || 'Player';
  return `You are THE RIDDLER - a mysterious puzzle master for Family Glitch.

## MISSION
Create a cryptic word association puzzle for ${targetName}.

## PUZZLE FORMAT
1. Write a cryptic clue (poetic, abstract, not obvious)
2. Generate exactly 25 UNIQUE single words for a 5x5 grid
3. Choose 5-8 words that secretly connect to the clue
4. The rest are strong decoys that almost fit

## CLUE STYLE
- Metaphorical or abstract\n- Open to interpretation\n- Hard enough that perfect scores are rare

## WORD SELECTION RULES
- Mix nouns, adjectives, concepts\n- Avoid category giveaways (no easy lists)\n- correctWords must be a subset of words\n- No duplicates

## RESPONSE FORMAT
Respond with valid JSON:
{
  \"clue\": \"The cryptic clue phrase\",
  \"hint\": \"Optional subtle nudge (keep vague)\",
  \"words\": [\"word1\", \"word2\", ... 25 total words],
  \"correctWords\": [\"words\", \"that\", \"match\"],
  \"explanation\": \"Brief explanation of the connection\"
}

Generate ONE cryptic puzzle now.`;
}

interface ScorePromptContext {
  targetPlayerName: string;
  clue: string;
  selectedWords: string[];
  correctWords: string[];
  allWords: string[];
  explanation: string;
}

/**
 * Build the prompt for scoring the player's selections
 */
export function buildCrypticScorerPrompt(context: ScorePromptContext): string {
  const { targetPlayerName, clue, selectedWords, correctWords, allWords, explanation } = context;

  // Defensive null checks
  const targetName = targetPlayerName || 'Player';
  const safeClue = clue || 'the puzzle';
  const safeSelectedWords = selectedWords || [];
  const safeCorrectWords = correctWords || [];
  const safeAllWords = allWords || [];
  const safeExplanation = explanation || 'The connection';

  return `You are THE RIDDLER - judging ${targetName}'s cryptic puzzle attempt.

## PUZZLE
Clue: \"${safeClue}\"
Intended connection: ${safeExplanation}

## GRID WORDS
${safeAllWords.join(', ')}

## CORRECT WORDS (${safeCorrectWords.length})
${safeCorrectWords.join(', ')}

## PLAYER SELECTIONS (${safeSelectedWords.length})
${safeSelectedWords.join(', ')}

## SCORING (FUZZY LOGIC)
1. Exact matches = full credit\n2. Creative but plausible matches = partial credit\n3. Clearly wrong selections reduce score

## RESPONSE FORMAT
Respond with valid JSON:
{
  \"score\": 0-5,
  \"exactMatches\": [\"words\", \"that\", \"matched\"],
  \"creativeMatches\": [\"words\", \"given\", \"partial\", \"credit\"],
  \"misses\": [\"clearly\", \"wrong\", \"ones\"],
  \"commentary\": \"Short cryptic line (max 15 words)\",
  \"revealedAnswer\": \"The full explanation of the connection\"
}

Only list words that appear in the grid.`;
}

export interface CrypticGenerateResponse {
  clue: string;
  hint?: string;
  words: string[];
  correctWords: string[];
  explanation: string;
}

export interface CrypticScoreResponse {
  score: number;
  exactMatches: string[];
  creativeMatches: string[];
  misses: string[];
  commentary: string;
  revealedAnswer: string;
}

/**
 * Parse the AI's generator response
 */
export function parseCrypticGeneratorResponse(text: string): CrypticGenerateResponse | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.clue || !Array.isArray(parsed.words) || !Array.isArray(parsed.correctWords)) {
      return null;
    }

    // Ensure we have exactly 25 words
    if (parsed.words.length !== 25) {
      console.warn(`Expected 25 words, got ${parsed.words.length}`);
      // Pad or trim to 25
      while (parsed.words.length < 25) {
        parsed.words.push('mystery');
      }
      parsed.words = parsed.words.slice(0, 25);
    }

    return {
      clue: parsed.clue,
      hint: parsed.hint,
      words: parsed.words,
      correctWords: parsed.correctWords,
      explanation: parsed.explanation || 'The connection remains a mystery...',
    };
  } catch {
    return null;
  }
}

/**
 * Parse the AI's scoring response
 */
export function parseCrypticScoreResponse(text: string): CrypticScoreResponse | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    if (typeof parsed.score !== 'number' || !parsed.commentary) {
      return null;
    }

    return {
      score: Math.min(5, Math.max(0, Math.round(parsed.score * 10) / 10)),
      exactMatches: parsed.exactMatches || [],
      creativeMatches: parsed.creativeMatches || [],
      misses: parsed.misses || [],
      commentary: parsed.commentary,
      revealedAnswer: parsed.revealedAnswer || 'The answer remains shrouded...',
    };
  } catch {
    return null;
  }
}

/**
 * Convert AI response to standard MiniGameResult
 */
export function toMiniGameResult(response: CrypticScoreResponse): MiniGameResult {
  const matchCount = response.exactMatches.length + response.creativeMatches.length;

  return {
    score: response.score,
    maxScore: 5,
    commentary: response.commentary,
    correctAnswer: response.revealedAnswer,
    bonusInfo: matchCount > 0
      ? `Found ${response.exactMatches.length} exact + ${response.creativeMatches.length} creative matches`
      : undefined,
  };
}
