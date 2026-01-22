/**
 * Cryptic Connection AI Prompts
 *
 * The Brain Teaser Builder:
 * - Generates a tough-but-fair core idea
 * - Creates 25 words with clear right/wrong + tricky decoys
 * - Scores players with explicit answer and trick keys
 */

import type { Turn, TransitionResponse } from '@/lib/types/game-state';
import type { MiniGameResult } from '../types';

/**
 * Grid size for Cryptic Connection puzzle.
 * A 5x5 grid provides the right balance of challenge and playability.
 */
const CRYPTIC_GRID_SIZE = 25;

export interface PriorCrypticGame {
  mysteryWord: string;
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
  priorCrypticGames: PriorCrypticGame[];
  allMiniGamesPlayed: Array<{ type: string; playerId: string; playerName: string }>;
  transitionResponses?: TransitionResponse[];
}

/**
 * Build the system prompt for generating a cryptic puzzle
 * Uses the "Mystery Word" approach with layered associations
 */
export function buildCrypticGeneratorPrompt(context: GeneratePromptContext): string {
  const {
    targetPlayerName,
    targetPlayerAge,
    targetPlayerRole,
    turns,
    priorCrypticGames,
    allMiniGamesPlayed,
    transitionResponses,
  } = context;

  // Defensive null checks
  const targetName = targetPlayerName || 'Player';
  const ageInfo = targetPlayerAge ? `, age ${targetPlayerAge}` : '';
  const roleInfo = targetPlayerRole ? ` (${targetPlayerRole})` : '';

  // Prior mystery words to avoid repeats
  const priorWordsBlock = (priorCrypticGames || []).length > 0
    ? `CORE IDEAS ALREADY USED (DO NOT REPEAT):\n${priorCrypticGames.map((g, i) => `${i + 1}. "${g.mysteryWord}" (played by ${g.playerName})`).join('\n')}`
    : 'No prior Cryptic Connection games yet.';

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

  return `You are THE BRAIN TEASER BUILDER - creating hard-but-fair word association puzzles for Family Glitch.

CURRENT GAME: cryptic_connection
This is a word association mini-game (not a cryptic riddle). Use completely different core ideas each time.

## MISSION
Generate a JSON object for a word association brain teaser for ${targetName}${roleInfo}${ageInfo}.

## PLAYER CONTEXT
Use the full history to personalize at least 3 words based on what this player has said or chosen.
Adjust difficulty to a ${targetPlayerAge || 'typical'}-year-old's vocabulary:
- Ages 8-11: concrete categories, obvious-but-not-trivial connections
- Ages 12-16: layered meanings, pop culture, light idioms
- Ages 17+: nuanced associations, subtle domain references

## STEP 1: Choose a "Core Idea"

Pick a word or concept with MULTIPLE meanings/uses. The best options work as nouns, verbs, adjectives, or in compound words.

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

Choose words where connections are CLEVER but still fair.

## FULL GAME DATA (Use for personalization)
${fullTurnsBlock}

${transitionResponsesBlock}

## CRITICAL: NO REPEATS
${priorWordsBlock}

${miniGamesPlayedBlock}

## UNIQUENESS RULES (MANDATORY)
1. NEVER use a mystery word that was already used in a prior Cryptic Connection game
2. Choose a COMPLETELY DIFFERENT mystery word each time
3. Vary the type of word: some nouns, some verbs, some that work as both
4. If similar concepts were used, pick a different domain entirely

## STEP 2: Generate 25 Grid Words
Create an array of exactly 25 UNIQUE single words with intentional layers:
- 8 TRUE answers (clearly connected to the core idea)
- 5 TRICK answers (tempting but actually wrong)
- 12 UNRELATED distractors (no connection at all)

## QUALITY RULES
- All words must be single words (no spaces or hyphens)
- Match vocabulary to player's age and knowledge level
- Mix nouns, verbs, adjectives appropriate for their age
- Ensure at least 3 words are personalized using prior turns or transition answers
- At least 2 TRUE answers must be subtle (not obvious objects/synonyms)
- Trick answers should be plausible due to common misconceptions or near-misses
- The answerKey and trickKey must be words from the grid with no overlap
- Make distractors convincing but clearly wrong
- Ensure variety - avoid obvious lists or categories

## RESPONSE FORMAT
Respond with valid JSON only:
{
  "mysteryWord": "WORD",
  "words": ["word1", "word2", ... exactly 25 words],
  "answerKey": ["exactly 8 correct words"],
  "trickKey": ["exactly 5 tempting but wrong words"]
}

Generate ONE UNIQUE puzzle now. The mystery word MUST be different from all prior games!`;
}

interface ScorePromptContext {
  targetPlayerName: string;
  mysteryWord: string;
  selectedWords: string[];
  allWords: string[];
  answerKey: string[];
  trickKey: string[];
}

/**
 * Build the prompt for scoring the player's selections
 * Uses fuzzy AI judging with per-word scoring
 */
export function buildCrypticScorerPrompt(context: ScorePromptContext): string {
  const { targetPlayerName, mysteryWord, selectedWords, allWords, answerKey, trickKey } = context;

  // Defensive null checks
  const targetName = targetPlayerName || 'Player';
  const safeMysteryWord = mysteryWord || 'the mystery word';
  const safeSelectedWords = selectedWords || [];
  const safeAllWords = allWords || [];
  const safeAnswerKey = answerKey || [];
  const safeTrickKey = trickKey || [];

  return `You are THE BRAIN TEASER JUDGE - evaluating ${targetName}'s word association attempt.

## THE CORE IDEA
${safeMysteryWord.toUpperCase()}

## THE GRID (all 25 words)
${safeAllWords.join(', ')}

## ANSWER KEY (8 correct)
${safeAnswerKey.join(', ')}

## TRICK KEY (5 tempting but wrong)
${safeTrickKey.join(', ')}

## PLAYER SELECTED (${safeSelectedWords.length} words)
${safeSelectedWords.join(', ')}

## SCORING RULES (Per-Word, 0-5 points)

Evaluate EACH word they selected:

**0 points** - Distractor (not connected)
**1 point** - Trick answer (tempting but wrong)
**4 points** - Correct answer (standard connection)
**5 points** - Correct answer with subtle or clever link

If they found a valid connection not in the answerKey, you may award 3-4 points,
but only if it is clearly justified and not a trick answer.

**Final Score (0-5):**
Average the individual word scores, then normalize.
If they selected more than 10 words, cap totalScore at 3 unless average >= 4.

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
  answerKey: string[];
  trickKey: string[];
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
      answerKey: Array.isArray(parsed.answerKey) ? parsed.answerKey : [],
      trickKey: Array.isArray(parsed.trickKey) ? parsed.trickKey : [],
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
    correctAnswer: `Core idea: ${mysteryWord.toUpperCase()}`,
    bonusInfo: highScorers.length > 0
      ? `Best picks: ${highScorers.map(b => `${b.word} (${b.points}pts)`).join(', ')}`
      : `Total points: ${totalPoints} across ${response.breakdown.length} selections`,
  };
}

/**
 * Extract prior Cryptic Connection games from turns
 */
export function getPriorCrypticGames(turns: Turn[]): PriorCrypticGame[] {
  return (turns || [])
    .filter((turn) => turn?.templateType === 'cryptic_connection' && turn.response)
    .map((turn) => {
      const response = turn.response as Record<string, any>;
      const params = turn.templateParams as Record<string, any>;
      return {
        mysteryWord: response?.mysteryWord || params?.mysteryWord || '',
        playerId: turn.playerId,
        playerName: turn.playerName,
      };
    })
    .filter((g) => g.mysteryWord);
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
