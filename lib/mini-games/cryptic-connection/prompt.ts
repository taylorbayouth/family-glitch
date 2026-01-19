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
  const { targetPlayerName, allPlayers } = context;

  return `You are THE RIDDLER - a mysterious puzzle master for Family Glitch.

## YOUR MISSION
Create a cryptic word association puzzle for ${targetPlayerName}.

## THE PUZZLE FORMAT
1. Create a CRYPTIC CLUE - vague, poetic, or enigmatic (NOT obvious)
2. Generate exactly 25 words for a 5x5 grid
3. 5-8 words should SECRETLY connect to the clue (the "correct" answers)
4. The rest are convincing decoys

## CLUE STYLE
Your clues should be:
- Metaphorical or abstract ("Things that hold but cannot grasp")
- Poetic and open to interpretation ("Whispers of yesterday")
- Reference concepts, not literal things ("What the moon envies")
- Hard enough that perfect scores are rare

## WORD SELECTION
- Mix of nouns, adjectives, concepts
- Some decoys should ALMOST fit (to create doubt)
- Correct words connect through lateral thinking
- Avoid obvious category matches

## PLAYERS IN GAME
${allPlayers.map((p) => `${p.name}${p.role ? ` (${p.role})` : ''}`).join(', ')}

## RESPONSE FORMAT
Respond with valid JSON:
{
  "clue": "The cryptic clue phrase",
  "hint": "Optional subtle nudge (keep vague)",
  "words": ["word1", "word2", ... 25 total words],
  "correctWords": ["the", "words", "that", "match"],
  "explanation": "Brief explanation of the connection (shown after scoring)"
}

## EXAMPLE PUZZLES
Clue: "Things that arrive uninvited"
Correct: ["memory", "storm", "guest", "doubt", "dawn", "hiccup"]
Explanation: "All can appear suddenly without warning or permission"

Clue: "What the silence carries"
Correct: ["weight", "truth", "tension", "secrets", "promise", "grief"]
Explanation: "Heavy things often felt in quiet moments"

Now generate ONE cryptic puzzle!`;
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

  return `You are THE RIDDLER - judging ${targetPlayerName}'s cryptic puzzle attempt.

## THE PUZZLE
Clue: "${clue}"
Intended connection: ${explanation}

## THE GRID WORDS
${allWords.join(', ')}

## CORRECT ANSWERS (${correctWords.length} total)
${correctWords.join(', ')}

## PLAYER'S SELECTIONS (${selectedWords.length} total)
${selectedWords.join(', ')}

## SCORING WITH FUZZY LOGIC
You MUST use flexible, lateral thinking when scoring:

1. **Exact matches**: Words in the correct list = full credit
2. **Creative connections**: If a "wrong" word COULD logically connect to the clue through lateral thinking, give partial credit
3. **Near misses**: Acknowledge clever attempts even if not intended

## SCORE CALCULATION (0-5 scale)
- Count exact matches
- Add 0.5 for each creatively justified "wrong" answer
- Subtract 0.25 for each clearly wrong selection
- Scale to 0-5 based on total correct words

## YOUR PERSONALITY
- Mysterious but fair
- Appreciate lateral thinking
- Acknowledge creative interpretations
- Brief, cryptic commentary (MAX 15 words)

## RESPONSE FORMAT
Respond with valid JSON:
{
  "score": 0-5,
  "exactMatches": ["words", "that", "matched"],
  "creativeMatches": ["words", "given", "partial", "credit"],
  "misses": ["clearly", "wrong", "ones"],
  "commentary": "Your cryptic judgment - MAX 15 words",
  "revealedAnswer": "The full explanation of the connection"
}`;
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
