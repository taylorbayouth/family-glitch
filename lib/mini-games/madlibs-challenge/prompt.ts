/**
 * Mad Libs Challenge AI Prompt
 *
 * The Wordsmith is a separate AI personality that:
 * - Generates clever, funny sentence templates with blanks
 * - The system assigns letters to blanks after generation
 * - Scores filled-in sentences for humor and creativity
 */

import type { MadLibsBlank, MiniGameResult } from '../types';

// Common letters that are easier to work with
export const COMMON_LETTERS = ['S', 'R', 'A', 'T', 'P', 'D', 'C', 'M', 'B', 'L', 'F', 'G', 'H', 'N', 'W'];

/**
 * Select random letters for blanks
 */
export function selectRandomLetters(count: number): string[] {
  const shuffled = [...COMMON_LETTERS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

interface GeneratePromptContext {
  targetPlayerName: string;
  allPlayers: Array<{ id: string; name: string; role?: string }>;
  scores: Record<string, number>;
}

/**
 * Build the system prompt for generating a Mad Libs sentence
 */
export function buildMadLibsGeneratorPrompt(context: GeneratePromptContext): string {
  const { targetPlayerName } = context;

  // Defensive null checks
  const targetName = targetPlayerName || 'Player';
  return `You are THE WORDSMITH - a witty, playful word game host for Family Glitch.

## MISSION
Generate one Mad Libs-style sentence for ${targetName} to complete.

## SENTENCE RULES
1. 8-14 words total
2. Include 1-3 blanks marked as ___
3. The reveal should be funny or oddly revealing when filled in
4. Use family-safe but edgy humor (no explicit content)
5. Avoid proper names and real people
6. The system assigns starting letters later

## RESPONSE FORMAT
Respond with valid JSON:
{
  \"template\": \"The sentence with ___ for each blank\",
  \"blankCount\": 1-3,
  \"hint\": \"Optional playful hint about the theme\"
}

## STRONG TEMPLATE SHAPES
- \"The last time I ___ at dinner, everyone ___.\"
- \"My secret talent is ___ while pretending to be ___.\"
- \"If I could ___ once without consequences, I'd do it ___.\"
- \"Everyone thinks I'm ___, but I'm actually ___.\"

Generate ONE creative template.`;
}

interface ScorePromptContext {
  targetPlayerName: string;
  sentenceTemplate: string;
  blanks: MadLibsBlank[];
  filledWords: string[];
  filledSentence: string;
  allPlayers: Array<{ id: string; name: string; role?: string }>;
}

/**
 * Build the prompt for scoring the filled-in Mad Libs
 */
export function buildMadLibsScorerPrompt(context: ScorePromptContext): string {
  const { targetPlayerName, sentenceTemplate, filledWords, filledSentence } = context;

  // Defensive null checks
  const targetName = targetPlayerName || 'Player';
  const template = sentenceTemplate || 'The sentence';
  const safeFilledWords = filledWords || [];
  const safeSentence = filledSentence || 'No sentence provided';

  return `You are THE WORDSMITH - a witty judge of creativity and humor for Family Glitch.

## MISSION
Score ${targetName}'s Mad Libs response for creativity and humor.

## TEMPLATE
\"${template}\"

## THEIR WORDS
${safeFilledWords.map((word, i) => `Blank ${i + 1}: \"${word || 'blank'}\"`).join('\n') || 'No words provided'}

## RESULT
\"${safeSentence}\"

## SCORING RULES (0-5)
5 = hilarious and clever\n4 = very funny\n3 = decent\n2 = safe\n1 = lazy\n0 = no effort

## TONE
- Reward unexpected combinations\n- Call out lazy choices\n- Max 10 words for commentary

## RESPONSE FORMAT
Respond with valid JSON:
{
  \"score\": 0-5,
  \"commentary\": \"<max 10 words>\",
  \"bestWord\": \"<funniest word>\",
  \"worstWord\": \"<weakest word, if any>\",
  \"filledSentence\": \"<the complete filled sentence>\"
}`;
}

export interface MadLibsGenerateResponse {
  template: string;
  blankCount: number;
  hint?: string;
}

export interface MadLibsScoreResponse {
  score: number;
  commentary: string;
  bestWord?: string;
  worstWord?: string;
  filledSentence: string;
}

/**
 * Parse the AI's generator response
 */
export function parseMadLibsGeneratorResponse(text: string): MadLibsGenerateResponse | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.template || typeof parsed.blankCount !== 'number') {
      return null;
    }

    // Validate that the template has the right number of blanks
    const blankMatches = parsed.template.match(/___/g);
    const actualBlanks = blankMatches ? blankMatches.length : 0;

    return {
      template: parsed.template,
      blankCount: actualBlanks || parsed.blankCount,
      hint: parsed.hint,
    };
  } catch {
    return null;
  }
}

/**
 * Parse the AI's scoring response
 */
export function parseMadLibsScoreResponse(text: string): MadLibsScoreResponse | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    if (typeof parsed.score !== 'number' || !parsed.commentary) {
      return null;
    }

    return {
      score: Math.min(5, Math.max(0, parsed.score)),
      commentary: parsed.commentary,
      bestWord: parsed.bestWord,
      worstWord: parsed.worstWord,
      filledSentence: parsed.filledSentence || '',
    };
  } catch {
    return null;
  }
}

/**
 * Convert AI response to standard MiniGameResult
 */
export function toMiniGameResult(response: MadLibsScoreResponse): MiniGameResult {
  return {
    score: response.score,
    maxScore: 5,
    commentary: response.commentary,
    correctAnswer: response.bestWord ? `Best word: ${response.bestWord}` : undefined,
    bonusInfo: response.worstWord ? `Weakest: ${response.worstWord}` : undefined,
  };
}

/**
 * Fill in the template with the provided words
 */
export function fillTemplate(template: string, words: string[]): string {
  let result = template;
  for (const word of words) {
    result = result.replace('___', word);
  }
  return result;
}

/**
 * Create blanks with assigned letters from a template
 */
export function createBlanksFromTemplate(template: string): MadLibsBlank[] {
  const blankMatches = template.match(/___/g);
  const count = blankMatches ? blankMatches.length : 0;
  const letters = selectRandomLetters(count);

  return letters.map((letter, index) => ({
    index,
    letter,
    filledWord: undefined,
  }));
}
