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
  targetPlayerAge?: number;
  targetPlayerRole?: string;
  allPlayers: Array<{ id: string; name: string; role?: string; age?: number }>;
  scores: Record<string, number>;
}

/**
 * Build the system prompt for generating a cryptic puzzle
 * Uses the "Mystery Word" approach with layered associations
 */
export function buildCrypticGeneratorPrompt(context: GeneratePromptContext): string {
  const { targetPlayerName, targetPlayerAge, targetPlayerRole } = context;

  // Defensive null checks
  const targetName = targetPlayerName || 'Player';
  const ageInfo = targetPlayerAge ? `, age ${targetPlayerAge}` : '';
  const roleInfo = targetPlayerRole ? ` (${targetPlayerRole})` : '';

  return `You are THE SEMANTIC ARCHITECT - creating word association puzzles for Family Glitch.

## MISSION
Generate a JSON object for a word association game for ${targetName}${roleInfo}${ageInfo}.

## PLAYER CONTEXT
- Adjust clue complexity to a ${targetPlayerAge || 'typical'}-year-old's vocabulary
- Younger players (under 12) need simpler mystery words with obvious connections
- Teens and adults can handle more subtle wordplay and obscure meanings
- Use words and cultural references they'd understand

## STEP 1: Choose a "Mystery Word"

Pick a word with MULTIPLE meanings/uses (polysemous). The best words work as nouns, verbs, adjectives, or in compound words.

**Ages 8-12** (simple, accessible):
- STAR (celebrity, sky object, to star in)
- LIGHT (brightness, not heavy, to light)
- ROCK (stone, music, to rock)
- PLAY (game, performance, to play)
- FIRE (flame, to fire someone, on fire)

**Ages 13-17** (moderate complexity):
- FALL (season, to fall, waterfall)
- STRIKE (hit, labor strike, bowling)
- POOL (swimming, car pool, pool resources)
- PARK (playground, to park, theme park)
- KEY (unlock, piano key, key point)

**Ages 18+** (expert-level):
- BAR (tavern, chocolate bar, bar exam, to bar entry)
- BANK (money, river bank, to bank on)
- SPRING (season, coil, to spring forth, water spring)
- PITCH (throw, sales pitch, tar pitch, musical pitch)
- POUND (weight, to pound, dog pound, British pound)

Choose words where connections are CLEVER, not obvious!

## STEP 2: Generate 25 Grid Words
Create an array of exactly 25 UNIQUE single words with intentional layers:
- 5 words that are LITERAL associations (obvious physical/direct connections)
- 5 words that are IDIOMATIC or METAPHORICAL associations (phrases, sayings)
- 5 words that are PUNS or COMPOUND words (wordplay, combinations with mystery word)
- 10 words that are completely UNRELATED distractors (no connection at all)

## QUALITY RULES
- All words must be single words (no spaces or hyphens)
- Match vocabulary to player's age and knowledge level
- Mix nouns, verbs, adjectives appropriate for their age
- Make distractors convincing but clearly wrong
- Ensure variety - avoid obvious lists or categories

## RESPONSE FORMAT
Respond with valid JSON only:
{
  "mysteryWord": "WORD",
  "words": ["word1", "word2", ... exactly 25 words]
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

Evaluate EACH word they selected:

**0 points** - No connection, pure distractor
- Example (BAR): "Ocean" - no relationship at all

**1-2 points** - Obvious/literal connection, first thing you'd think of
- Example (BAR): "Beer" - too obvious (bar serves beer)
- Example (BAR): "Stool" - too literal (barstool)

**3-4 points** - Clever connection, compound word, idiom, or metaphor
- Example (BAR): "Exam" - Bar Exam (professional test)
- Example (BAR): "Code" - Bar Code (product scanner)
- Example (BAR): "Gold" - Gold Bar (bullion)

**5 points** - Brilliant lateral thinking, unexpected but valid
- Example (BAR): "Mars" - Mars Bar (candy)
- Example (BAR): "Space" - Space Bar (keyboard)
- Example (BAR): "Raise" - "Raise the bar" (idiom)

**REWARD CREATIVITY:**
- If they found a connection you didn't plan, give full credit if it's valid
- Multiple meanings count: "Scales" could be fish scales, music scales, or weight scales
- Compound words are valuable: "Ball" + "Park" = Ballpark
- Idioms and phrases count: "Raise" + "Bar" = "Raise the bar"

**Final Score (0-5):**
Average the individual word scores, then normalize:
- High average (4-5 pts/word) → 5 points
- Good average (3-4 pts/word) → 4 points
- Decent average (2-3 pts/word) → 3 points
- Weak average (1-2 pts/word) → 2 points
- Poor average (<1 pt/word) → 0-1 points

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
