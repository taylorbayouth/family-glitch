/**
 * Cryptic Connection AI Prompts
 *
 * The Riddler is a cryptic puzzle master that:
 * - Generates vague, enigmatic clues
 * - Creates 25 words where some secretly connect to the clue
 * - Scores players with fuzzy logic on their word selections
 */

import type { MiniGameResult } from '../types';

/**
 * Grid size for Cryptic Connection puzzle.
 * A 5x5 grid provides the right balance of challenge and playability.
 */
const CRYPTIC_GRID_SIZE = 25;

interface GeneratePromptContext {
  targetPlayerName: string;
  allPlayers: Array<{ id: string; name: string; role?: string }>;
  scores: Record<string, number>;
}

/**
 * Build the system prompt for generating a cryptic puzzle
 * Uses the "Mystery Word" approach with layered associations
 */
export function buildCrypticGeneratorPrompt(context: GeneratePromptContext): string {
  const { targetPlayerName } = context;

  // Defensive null checks
  const targetName = targetPlayerName || 'Player';
  return `You are THE SEMANTIC ARCHITECT - creating word association puzzles for Family Glitch.

## MISSION
Generate a JSON object for a word association game for ${targetName}.

## STEP 1: Choose a "Mystery Word"
Pick a polysemous word with multiple meanings (e.g., "BAR", "POUND", "BANK", "SPRING", "PITCH").

## STEP 2: Generate 25 Grid Words
Create an array of exactly 25 UNIQUE single words with intentional layers:
- 5 words that are LITERAL associations (obvious physical/direct connections)
- 5 words that are IDIOMATIC or METAPHORICAL associations (phrases, sayings)
- 5 words that are PUNS or COMPOUND words (wordplay, combinations with mystery word)
- 10 words that are completely UNRELATED distractors (no connection at all)

## QUALITY RULES
- All words must be single words (no spaces or hyphens)
- Mix nouns, verbs, adjectives
- Make distractors convincing but clearly wrong
- Ensure variety - avoid obvious lists or categories

## RESPONSE FORMAT
Respond with valid JSON only:
{
  "mysteryWord": "WORD",
  "words": ["word1", "word2", ... exactly 25 words],
  "hint": "Optional cryptic hint (keep vague, max 10 words)"
}

Generate ONE puzzle now.`;
}

interface ScorePromptContext {
  targetPlayerName: string;
  mysteryWord: string;
  selectedWords: string[];
  allWords: string[];
}

/**
 * Build the prompt for scoring the player's selections
 * Uses fuzzy AI judging with per-word scoring
 */
export function buildCrypticScorerPrompt(context: ScorePromptContext): string {
  const { targetPlayerName, mysteryWord, selectedWords, allWords } = context;

  // Defensive null checks
  const targetName = targetPlayerName || 'Player';
  const safeMysteryWord = mysteryWord || 'the mystery word';
  const safeSelectedWords = selectedWords || [];
  const safeAllWords = allWords || [];

  return `You are THE FUZZY JUDGE - evaluating ${targetName}'s word association attempt.

## THE MYSTERY WORD
${safeMysteryWord.toUpperCase()}

## THE GRID (all 25 words)
${safeAllWords.join(', ')}

## PLAYER SELECTED (${safeSelectedWords.length} words)
${safeSelectedWords.join(', ')}

## SCORING RULES (Per-Word, 0-5 points)
Evaluate EACH selected word individually:
- 0 pts: No logical connection (Distractor)
- 1-2 pts: Obvious/Literal connection (e.g., "Tender" for "BAR" = Bartender)
- 3-4 pts: Clever metaphor, idiom, or compound word (e.g., "Exam" for "BAR" = Bar Exam)
- 5 pts: Brilliant lateral thinking or deep wordplay (e.g., "Mars" for "BAR" = Mars Bar)

## FUZZY LOGIC
- If a player finds a valid connection you didn't think of, REWARD IT
- Example: "Space" for "BAR" could be "Space Bar" (keyboard) = 4-5 points
- Be generous with creative interpretations if they make semantic sense

## RESPONSE FORMAT
Return JSON only:
{
  "breakdown": [
    { "word": "WORD", "points": 0-5, "reason": "Brief explanation (max 10 words)" },
    ...
  ],
  "totalScore": 0-5,
  "commentary": "One witty line about their performance (max 15 words)"
}

The totalScore should be normalized to 0-5 based on the average quality of selections, not just the sum.`;
}

export interface CrypticGenerateResponse {
  mysteryWord: string;
  hint?: string;
  words: string[];
}

export interface WordScore {
  word: string;
  points: number;
  reason: string;
}

export interface CrypticScoreResponse {
  breakdown: WordScore[];
  totalScore: number;
  commentary: string;
}

/**
 * Parse the AI's generator response
 */
export function parseCrypticGeneratorResponse(text: string): CrypticGenerateResponse | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.mysteryWord || !Array.isArray(parsed.words)) {
      return null;
    }

    // Ensure we have exactly the required grid size
    if (parsed.words.length !== CRYPTIC_GRID_SIZE) {
      console.warn(`Expected ${CRYPTIC_GRID_SIZE} words, got ${parsed.words.length}`);
      // Pad or trim to correct size
      while (parsed.words.length < CRYPTIC_GRID_SIZE) {
        parsed.words.push('mystery');
      }
      parsed.words = parsed.words.slice(0, CRYPTIC_GRID_SIZE);
    }

    return {
      mysteryWord: parsed.mysteryWord,
      hint: parsed.hint,
      words: parsed.words,
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

    if (!Array.isArray(parsed.breakdown) || typeof parsed.totalScore !== 'number' || !parsed.commentary) {
      return null;
    }

    return {
      breakdown: parsed.breakdown.map((item: any) => ({
        word: item.word || '',
        points: Math.min(5, Math.max(0, item.points || 0)),
        reason: item.reason || '',
      })),
      totalScore: Math.min(5, Math.max(0, parsed.totalScore)),
      commentary: parsed.commentary,
    };
  } catch {
    return null;
  }
}

/**
 * Convert AI response to standard MiniGameResult
 */
export function toMiniGameResult(response: CrypticScoreResponse, mysteryWord: string): MiniGameResult {
  // Calculate stats
  const highScorers = response.breakdown.filter(b => b.points >= 4);
  const totalPoints = response.breakdown.reduce((sum, b) => sum + b.points, 0);

  return {
    score: response.totalScore,
    maxScore: 5,
    commentary: response.commentary,
    correctAnswer: `Mystery word: ${mysteryWord.toUpperCase()}`,
    bonusInfo: highScorers.length > 0
      ? `Best picks: ${highScorers.map(b => `${b.word} (${b.points}pts)`).join(', ')}`
      : `Total points: ${totalPoints} across ${response.breakdown.length} selections`,
  };
}
