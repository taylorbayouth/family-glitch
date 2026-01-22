/**
 * Mad Libs Challenge AI Prompt
 *
 * The Wordsmith is a separate AI personality that:
 * - Generates clever, funny sentence templates with blanks
 * - The system assigns letters to blanks after generation
 * - Scores filled-in sentences for humor and creativity
 */

import type { Turn, TransitionResponse } from '@/lib/types/game-state';
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

export interface PriorMadLibsGame {
  template: string;
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
  priorMadLibsGames: PriorMadLibsGame[];
  allMiniGamesPlayed: Array<{ type: string; playerId: string; playerName: string }>;
}

/**
 * Build the system prompt for generating a Mad Libs sentence
 */
export function buildMadLibsGeneratorPrompt(context: GeneratePromptContext): string {
  const { targetPlayerName, targetPlayerAge, targetPlayerRole, turns, transitionResponses, priorMadLibsGames, allMiniGamesPlayed } = context;

  // Defensive null checks
  const targetName = targetPlayerName || 'Player';
  const ageInfo = targetPlayerAge ? `, age ${targetPlayerAge}` : '';
  const roleInfo = targetPlayerRole ? ` (${targetPlayerRole})` : '';

  // Prior templates to avoid repeats
  const priorTemplatesBlock = (priorMadLibsGames || []).length > 0
    ? `TEMPLATES ALREADY USED (DO NOT REPEAT OR USE SIMILAR):\n${priorMadLibsGames.map((g, i) => `${i + 1}. "${g.template}" (played by ${g.playerName})`).join('\n')}`
    : 'No prior Mad Libs games yet.';

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

  return `You are THE WORDSMITH - a witty, playful word game host for Family Glitch.

CURRENT GAME: madlibs_challenge
This is a fill-in-the-blank sentence game. Use completely different templates each time.

## MISSION
Generate one Mad Libs-style sentence for ${targetName}${roleInfo}${ageInfo} to complete.

## PLAYER CONTEXT
- ${targetName} is ${targetPlayerAge || 'an adult'}
- The goal is to make players feel WITTY, not just shocking
- Great templates reward clever word choices and unexpected combinations
- Avoid setups that obviously beg for crude answers

## SENTENCE RULES
1. 8-14 words total
2. Include exactly 2 blanks marked as ___
3. Structure it so clever word combos create the humor
4. Avoid proper names and real people
5. The system assigns starting letters later

## RESPONSE FORMAT
Respond with valid JSON:
{
  \"template\": \"The sentence with ___ for each blank\",
  \"blankCount\": 1-3
}

## STRONG TEMPLATE EXAMPLES (2 blanks, reward cleverness)

**Science/Discovery:**
- \"Scientists discovered that ___ is actually just ___ in disguise.\"
- \"Research shows that ___ can cure ___\"

**Life Advice:**
- \"The secret to a happy marriage is ___ and plenty of ___.\"
- \"Life hack: Replace your ___ with ___ for instant results.\"
- \"According to my horoscope, I should avoid ___ near ___.\"

**Explanations:**
- \"In my defense, the ___ was already ___ when I got there.\"
- \"I'm not saying it was ___, but it was definitely ___.\"

**Instructions:**
- \"Step 1: ___. Step 2: ___. Step 3: Profit.\"
- \"To impress your in-laws, simply combine ___ with ___.\"

**Comparisons:**
- \"Nothing says 'I love you' like ___ covered in ___.\"
- \"The recipe calls for two cups of ___ and a pinch of ___.\"
- \"The difference between ___ and ___ is surprisingly small.\"

**Age-Appropriate Guidance:**
- Ages 10-14: Keep it silly and wholesome (food, animals, school)
- Ages 15-17: Allow mild edge (embarrassment, awkwardness)
- Ages 18+: Full creative freedom (still favor wit over crude)

## FULL GAME DATA (Use for personalization)
${fullTurnsBlock}

${transitionResponsesBlock}

## CRITICAL: NO REPEATS
${priorTemplatesBlock}

${miniGamesPlayedBlock}

## UNIQUENESS RULES (MANDATORY)
1. NEVER use a template that was already used in a prior Mad Libs game
2. NEVER use a similar template with different wording
3. Vary the THEME: some science, some life advice, some explanations, some comparisons
4. Each template should feel FRESH and DIFFERENT

The best templates are OPEN-ENDED - they don't obviously beg for dirty answers. Wit > Shock.

Generate ONE UNIQUE creative template. It MUST be different from all prior templates!`;
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

## SCORING RUBRIC (0-5)

**5 points** - Hilarious and CLEVER! Unexpected combo that's witty, not just crude
- Example: "Scientists discovered that PIZZA is actually just SADNESS in disguise"

**4 points** - Very funny, creative word choices
- Example: "The secret to happiness is SILENCE and plenty of SNACKS"

**3 points** - Decent attempt, got a chuckle
- Example: "Life hack: Replace your STRESS with NAPS"

**2 points** - Safe/predictable, went for obvious choices
- Example: "Nothing says 'I love you' like FLOWERS covered in CHOCOLATE"

**1 point** - Lazy/no effort, just filled blanks
- Example: "Step 1: THING. Step 2: STUFF. Step 3: Profit"

**0 points** - Literally no effort or nonsense

**What makes answers GREAT:**
✅ Unexpected combinations that make sense together
✅ Words that create irony or absurdity
✅ Cleverness over crudeness
✅ Shows personality and humor style

**What makes answers LAZY:**
❌ Generic filler words (stuff, thing, person)
❌ Too obvious/predictable
❌ Just going for shock value
❌ Didn't try to be funny

## RESPONSE FORMAT
Respond with valid JSON:
{
  \"score\": 0-5,
  \"commentary\": \"<max 10 words, witty and sharp>\",
  \"bestWord\": \"<funniest word>\",
  \"worstWord\": \"<weakest word, if any>\",
  \"filledSentence\": \"<the complete filled sentence>\"
}`;
}

export interface MadLibsGenerateResponse {
  template: string;
  blankCount: number;
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

/**
 * Extract prior Mad Libs games from turns
 */
export function getPriorMadLibsGames(turns: Turn[]): PriorMadLibsGame[] {
  return (turns || [])
    .filter((turn) => turn?.templateType === 'madlibs_challenge' && turn.response)
    .map((turn) => {
      const response = turn.response as Record<string, any>;
      const params = turn.templateParams as Record<string, any>;
      return {
        template: response?.template || params?.template || '',
        playerId: turn.playerId,
        playerName: turn.playerName,
      };
    })
    .filter((g) => g.template);
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
