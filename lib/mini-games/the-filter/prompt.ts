/**
 * The Filter AI Prompts
 *
 * The Logic Master creates binary classification puzzles that test knowledge and estimation.
 * Players must identify all items that pass a specific rule or constraint.
 */

import type { MiniGameResult } from '../types';

interface GeneratePromptContext {
  targetPlayerName: string;
  targetPlayerAge?: number;
  targetPlayerRole?: string;
  allPlayers: Array<{ id: string; name: string; role?: string; age?: number }>;
  scores: Record<string, number>;
}

/**
 * Build the system prompt for generating a Filter puzzle
 * Creates a rule/constraint and 9-12 items to classify
 */
export function buildFilterGeneratorPrompt(context: GeneratePromptContext): string {
  const { targetPlayerName, targetPlayerAge, targetPlayerRole } = context;

  const targetName = targetPlayerName || 'Player';
  const ageInfo = targetPlayerAge ? `, age ${targetPlayerAge}` : '';
  const roleInfo = targetPlayerRole ? ` (${targetPlayerRole})` : '';

  return `You are THE LOGIC MASTER - creating binary classification puzzles for Family Glitch.

## MISSION
Generate a JSON object for "The Filter" game for ${targetName}${roleInfo}${ageInfo}.

## PLAYER CONTEXT
- Match category difficulty to a ${targetPlayerAge || 'typical'}-year-old's knowledge
- Younger players (under 12) need accessible categories with familiar items
- Teens and adults can handle more obscure facts and edge cases
- Use cultural references and knowledge they'd reasonably have

## STEP 1: Create The Rule
Pick a specific, testable constraint appropriate for the player's age:
- **Kids-friendly**: "Is a mammal", "Has wheels", "Is found in a kitchen"
- **All ages**: "Contains the letter E", "Is a palindrome", "Has more than 5 letters"
- **Teens/Adults**: "Invented before 1900", "Is heavier than water", "Predates the internet"

Categories to choose from:
- **History**: "Invented before 1900", "Happened in the 20th century"
- **Science**: "Heavier than water", "Is technically a berry", "Can survive in space"
- **Geography**: "Has population > 1 million", "Is in the Southern Hemisphere"
- **Logic**: "Contains the letter E", "Is a palindrome", "Is a prime number"
- **Culture**: "Predates the internet", "Originated in Asia"

## STEP 2: Generate 9-12 Items
Create exactly 9-12 items with intentional difficulty layers:
- **3-4 Obviously TRUE** (pass the filter clearly)
- **3-4 Obviously FALSE** (clearly don't pass)
- **2-3 TRICK ITEMS** (common misconceptions, edge cases that surprise)
- **1-2 EDGE CASES** (technically correct but debatable)

## QUALITY RULES
- Items should be nouns, names, or concepts the player would know
- Match complexity to their age - no obscure references for young players
- Make it debate-worthy - some should spark "Wait, really?" moments
- Trick items are worth bonus points if correctly identified
- Mix obvious and subtle items appropriate for their knowledge level

## RESPONSE FORMAT
Respond with valid JSON only:
{
  "rule": "The constraint in natural language",
  "gridItems": [
    {
      "label": "Item name",
      "isCorrect": true/false,
      "isTrick": false,
      "reason": "Brief explanation why it passes/fails"
    },
    ... exactly 9-12 items
  ],
  "hint": "Optional subtle hint (max 10 words)"
}

Generate ONE puzzle now.`;
}

interface ScorePromptContext {
  targetPlayerName: string;
  rule: string;
  selectedItems: string[];
  correctItems: string[];
}

/**
 * Build the prompt for scoring the player's selections
 * Simple 0-5 scoring like other mini-games
 */
export function buildFilterScorerPrompt(context: ScorePromptContext): string {
  const { targetPlayerName, rule, selectedItems, correctItems } = context;

  const targetName = targetPlayerName || 'Player';
  const safeRule = rule || 'the rule';
  const safeSelectedItems = selectedItems || [];
  const safeCorrectItems = correctItems || [];

  return `You are THE LOGIC MASTER - scoring ${targetName}'s filter attempt.

## THE RULE
"${safeRule}"

## CORRECT ITEMS (that pass the filter)
${safeCorrectItems.join(', ')}

## PLAYER SELECTED
${safeSelectedItems.join(', ')}

## SCORING (0-5 points)
- Consider how many correct items they found
- Penalize wrong selections (items that don't pass)
- Acknowledge close calls and edge cases generously
- 5 = Perfect or near-perfect
- 3-4 = Got most of them
- 1-2 = Struggled but tried
- 0 = Completely missed the mark

## RESPONSE FORMAT
Return JSON only:
{
  "score": 0-5,
  "commentary": "One witty line about their logic (max 15 words)"
}

Keep it simple and fun.`;
}

export interface FilterGenerateResponse {
  rule: string;
  gridItems: Array<{
    label: string;
    isCorrect: boolean;
    isTrick?: boolean;
    reason: string;
  }>;
  hint?: string;
}

export interface FilterScoreResponse {
  score: number;
  commentary: string;
}

/**
 * Parse the AI's generator response
 */
export function parseFilterGeneratorResponse(text: string): FilterGenerateResponse | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.rule || !Array.isArray(parsed.gridItems)) {
      return null;
    }

    // Ensure we have 9-12 items
    if (parsed.gridItems.length < 9 || parsed.gridItems.length > 12) {
      console.warn(`Expected 9-12 items, got ${parsed.gridItems.length}`);
      // Trim or pad
      while (parsed.gridItems.length < 9) {
        parsed.gridItems.push({ label: 'Mystery', isCorrect: false, reason: 'Unknown' });
      }
      parsed.gridItems = parsed.gridItems.slice(0, 12);
    }

    return {
      rule: parsed.rule,
      gridItems: parsed.gridItems.map((item: any) => ({
        label: item.label || 'Item',
        isCorrect: Boolean(item.isCorrect),
        isTrick: Boolean(item.isTrick),
        reason: item.reason || '',
      })),
      hint: parsed.hint,
    };
  } catch {
    return null;
  }
}

/**
 * Parse the AI's scoring response
 */
export function parseFilterScoreResponse(text: string): FilterScoreResponse | null {
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
    };
  } catch {
    return null;
  }
}

/**
 * Convert AI response to standard MiniGameResult
 */
export function toMiniGameResult(response: FilterScoreResponse, rule: string, correctItems: string[]): MiniGameResult {
  return {
    score: response.score,
    maxScore: 5,
    commentary: response.commentary,
    correctAnswer: `Rule: "${rule}"`,
    bonusInfo: `Correct items: ${correctItems.join(', ')}`,
  };
}
