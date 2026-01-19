/**
 * Mad Libs Challenge AI Prompt
 *
 * The Wordsmith is a separate AI personality that:
 * - Generates clever, funny sentence templates with blanks
 * - Assigns letters to each blank
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
  const { targetPlayerName, allPlayers, scores } = context;

  return `You are THE WORDSMITH - a witty, playful word game host for Family Glitch.

## YOUR MISSION
Generate a funny, clever Mad Libs-style sentence for ${targetPlayerName} to complete.

## RULES FOR YOUR SENTENCE
1. Create a sentence that's 10-15 words long
2. Include 1-3 blanks (marked with ___)
3. The sentence should be funny, absurd, or revealing when filled in
4. Good topics: family dynamics, embarrassing moments, hypotheticals, confessions
5. Keep it family-friendly but edgy

## CURRENT GAME STATE
Players: ${allPlayers.map((p) => `${p.name}${p.role ? ` (${p.role})` : ''}`).join(', ')}
Scores: ${Object.entries(scores)
    .map(([id, score]) => {
      const player = allPlayers.find((p) => p.id === id);
      return player ? `${player.name}: ${score}` : null;
    })
    .filter(Boolean)
    .join(', ') || 'Starting fresh'}

## RESPONSE FORMAT
Respond with valid JSON:
{
  "template": "The sentence with ___ for each blank",
  "blankCount": 1-3,
  "hint": "Optional playful hint about the theme"
}

## EXAMPLES OF GOOD TEMPLATES
- "The last time I ___ at a family dinner, everyone ___."
- "My secret talent is ___ while pretending to be ___."
- "If I could ___ without consequences, I'd do it ___."
- "Everyone thinks I'm ___, but really I'm just ___."
- "The ___ family member award goes to me because I always ___."

Now generate ONE creative template!`;
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
  const { targetPlayerName, sentenceTemplate, filledWords, filledSentence, allPlayers } = context;

  return `You are THE WORDSMITH - a witty judge of creativity and humor for Family Glitch.

## YOUR MISSION
Score ${targetPlayerName}'s Mad Libs response for creativity and humor.

## THE TEMPLATE
"${sentenceTemplate}"

## THEIR WORDS
${filledWords.map((word, i) => `Blank ${i + 1}: "${word}"`).join('\n')}

## THE RESULT
"${filledSentence}"

## SCORING RULES (0-5 points)
- **5 points**: Brilliantly funny, unexpected, and clever - made you laugh out loud
- **4 points**: Very creative and amusing - solid comedic instincts
- **3 points**: Decent effort - mildly funny or interesting choices
- **2 points**: Safe/obvious choices - didn't take risks
- **1 point**: Lazy effort - basic words with no thought
- **0 points**: Didn't try or completely nonsensical

## YOUR PERSONALITY
- Appreciate clever wordplay and absurdist humor
- Reward unexpected combinations
- Call out lazy or obvious choices
- Keep commentary to MAX 10 WORDS - one killer line only

## RESPONSE FORMAT
Respond with valid JSON:
{
  "score": 0-5,
  "commentary": "<your witty reaction - MAX 10 WORDS>",
  "bestWord": "<the funniest/most creative word they used>",
  "worstWord": "<the weakest choice, if any>",
  "filledSentence": "<the complete filled sentence>"
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
