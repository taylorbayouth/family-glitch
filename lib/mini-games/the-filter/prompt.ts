/**
 * The Filter AI Prompts
 *
 * The Logic Master creates binary classification puzzles that test knowledge and estimation.
 * Players must identify all items that pass a specific rule or constraint.
 */

import type { Turn, TransitionResponse } from '@/lib/types/game-state';
import type { MiniGameResult } from '../types';

export interface PriorFilterGame {
  rule: string;
  playerId: string;
  playerName: string;
}

interface GeneratePromptContext {
  targetPlayerName: string;
  targetPlayerAge?: number;
  targetPlayerRole?: string;
  allPlayers: Array<{ id: string; name: string; role?: string; age?: number }>;
  scores: Record<string, number>;
  turns: Turn[];
  transitionResponses?: TransitionResponse[];
  priorFilterGames: PriorFilterGame[];
  allMiniGamesPlayed: Array<{ type: string; playerId: string; playerName: string }>;
}

/**
 * Build the system prompt for generating a Filter puzzle
 * Creates a rule/constraint and 9-12 items to classify
 */
export function buildFilterGeneratorPrompt(context: GeneratePromptContext): string {
  const { targetPlayerName, targetPlayerAge, targetPlayerRole, turns, transitionResponses, priorFilterGames, allMiniGamesPlayed } = context;

  const targetName = targetPlayerName || 'Player';
  const ageInfo = targetPlayerAge ? `, age ${targetPlayerAge}` : '';
  const roleInfo = targetPlayerRole ? ` (${targetPlayerRole})` : '';

  // Prior rules to avoid repeats
  const priorRulesBlock = (priorFilterGames || []).length > 0
    ? `RULES ALREADY USED (DO NOT REPEAT OR USE SIMILAR):\n${priorFilterGames.map((g, i) => `${i + 1}. "${g.rule}" (played by ${g.playerName})`).join('\n')}`
    : 'No prior Filter games yet.';

  // All mini-games played for variety tracking
  const miniGamesPlayedBlock = (allMiniGamesPlayed || []).length > 0
    ? `Mini-games played this session:\n${allMiniGamesPlayed.map(g => `- ${g.type} (${g.playerName})`).join('\n')}`
    : '';

  // Full turn history for context
  const fullTurnsBlock = (turns || []).length > 0
    ? `Full game turn history:\n${JSON.stringify(turns, null, 2)}`
    : '';

  // Transition responses (insight collection)
  const transitionResponsesBlock = (transitionResponses || []).length > 0
    ? `Insight collection responses:\n${JSON.stringify(transitionResponses, null, 2)}`
    : '';

  return `You are THE LOGIC MASTER - creating binary classification puzzles for Family Glitch.

CURRENT GAME: the_filter
This is a classification puzzle mini-game. Use completely different rules each time.

## MISSION
Generate a JSON object for "The Filter" game for ${targetName}${roleInfo}${ageInfo}.

## PLAYER CONTEXT
- Match category difficulty to a ${targetPlayerAge || 'typical'}-year-old's knowledge
- Younger players (under 12) need accessible categories with familiar items
- Teens and adults can handle more obscure facts and edge cases
- Use cultural references and knowledge they'd reasonably have

## STEP 1: Create The Rule

Pick a CLEVER, testable constraint. The best rules spark "Wait, really?" moments.

**Age-Appropriate Difficulty:**

**Ages 8-12** (accessible but fun):
- "Is a mammal", "Has wheels", "Is found in a kitchen"
- "Contains the letter A", "Starts with a vowel"
- "Is larger than a car", "Can fly"

**Ages 13-17** (requires knowledge):
- "Invented before 1950", "Is technically a fruit"
- "Has an odd number of syllables", "Contains double letters"
- "Is older than TikTok", "Can be eaten raw"

**Ages 18+** (expert-level):
- "Predates the internet (1989)", "Is heavier than water"
- "Is a palindrome", "Happened during the Cold War"
- "Originated in Europe", "Is technically a berry"

**Best Rule Categories:**
- **Tricky Science**: "Is heavier than water", "Is technically a berry"
- **Surprising History**: "Invented before the telephone (1876)"
- **Word Logic**: "Is a palindrome", "Contains 3 syllables"
- **Geography**: "Is in Southern Hemisphere", "Has population > 10M"
- **Culture/Tech**: "Predates the internet", "Before color TV"

Make it challenging but solvable!

## FULL GAME DATA (Use for personalization)
${fullTurnsBlock}

${transitionResponsesBlock}

## CRITICAL: NO REPEATS
${priorRulesBlock}

${miniGamesPlayedBlock}

## UNIQUENESS RULES (MANDATORY)
1. NEVER use a rule that was already used in a prior Filter game
2. NEVER use a similar rule with different wording (e.g., if "Is a mammal" was used, don't use "Is a warm-blooded animal")
3. Use COMPLETELY DIFFERENT categories and concepts each time
4. Vary the type: some science, some history, some wordplay, some geography

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
  ]
}

Generate ONE UNIQUE puzzle now. The rule MUST be different from all prior games!`;
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

## SCORING RUBRIC (0-5 points)

Calculate based on accuracy:
- **Correct selections** = +1 point per item (up to 5)
- **Wrong selections** = -0.5 points per item

Then map to 0-5 scale:
- **5 points** - Perfect or nearly perfect (90-100% accuracy)
- **4 points** - Strong performance (75-89% accuracy)
- **3 points** - Decent attempt (50-74% accuracy)
- **2 points** - Struggled but showed some logic (25-49%)
- **1 point** - Got a few right, mostly wrong (10-24%)
- **0 points** - Completely missed the pattern (0-9%)

**Be fair with edge cases:**
- Trick items should be weighted more favorably if player caught them
- Acknowledge clever reasoning even if wrong
- Reward partial understanding

## RESPONSE FORMAT
Return JSON only:
{
  "score": 0-5,
  "commentary": "One witty line about their logic (max 15 words)"
}

Keep commentary sharp and fun!`;
}

export interface FilterGenerateResponse {
  rule: string;
  gridItems: Array<{
    label: string;
    isCorrect: boolean;
    isTrick?: boolean;
    reason: string;
  }>;
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

/**
 * Extract prior Filter games from turns
 */
export function getPriorFilterGames(turns: Turn[]): PriorFilterGame[] {
  return (turns || [])
    .filter((turn) => turn?.templateType === 'the_filter' && turn.response)
    .map((turn) => {
      const response = turn.response as Record<string, any>;
      const params = turn.templateParams as Record<string, any>;
      return {
        rule: response?.rule || params?.rule || '',
        playerId: turn.playerId,
        playerName: turn.playerName,
      };
    })
    .filter((g) => g.rule);
}

/**
 * Extract all mini-games played from turns
 */
export function getAllMiniGamesPlayed(turns: Turn[]): Array<{ type: string; playerId: string; playerName: string }> {
  const miniGameTypes = [
    'hard_trivia',
    'trivia_challenge',
    'lighting_round',
    'personality_match',
    'the_filter',
    'cryptic_connection',
    'madlibs_challenge',
  ];

  return (turns || [])
    .filter((turn) => turn && miniGameTypes.includes(turn.templateType) && turn.status === 'completed')
    .map((turn) => ({
      type: turn.templateType,
      playerId: turn.playerId,
      playerName: turn.playerName,
    }));
}
