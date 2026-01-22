/**
 * Lighting Round - AI Prompts
 *
 * Generates one timed binary question at a time.
 * Uses full game context + local question history to avoid repeats.
 */

import type { Turn, TransitionResponse } from '@/lib/types/game-state';
import type { MiniGamePlayer } from '../registry';
import { extractAndParseJSON } from '../utils';

export interface LightingRoundHistoryItem {
  question: string;
  leftText: string;
  rightText: string;
  correctChoice: 'left' | 'right';
  subjectPlayerId?: string;
  subjectPlayerName?: string;
  playerChoice?: 'left' | 'right' | 'neither' | null;
  score?: number;
}

export interface LightingRoundPromptContext {
  targetPlayer: MiniGamePlayer;
  allPlayers: MiniGamePlayer[];
  turns: Turn[];
  transitionResponses?: TransitionResponse[];
  scores: Record<string, number>;
  roundIndex: number;
  totalRounds: number;
  seconds: number;
  previousQuestions: LightingRoundHistoryItem[];
  priorLightingQuestions: LightingRoundHistoryItem[];
  allMiniGamesPlayed: Array<{ type: string; playerId: string; playerName: string }>;
}

export interface LightingRoundQuestionResponse {
  question: string;
  leftText: string;
  rightText: string;
  correctChoice: 'left' | 'right';
  subjectPlayerId?: string;
  subjectPlayerName?: string;
  evidence?: string;
  commentaryCorrect?: string;
  commentaryWrong?: string;
  commentaryPass?: string;
}

/**
 * Build prompt for generating a Lighting Round question.
 */
export function buildLightingRoundQuestionPrompt(
  context: LightingRoundPromptContext
): string {
  const {
    targetPlayer,
    allPlayers,
    turns,
    transitionResponses,
    scores,
    roundIndex,
    totalRounds,
    seconds,
    previousQuestions,
    priorLightingQuestions,
    allMiniGamesPlayed,
  } = context;

  const targetName = targetPlayer?.name || 'Player';
  const targetAge = targetPlayer?.age;
  const targetRole = targetPlayer?.role || 'player';

  const playerList = (allPlayers || [])
    .map(
      (player) =>
        `- ${player.name} (id: "${player.id}", role: ${player.role || 'player'}, age: ${
          player.age || 'unknown'
        })`
    )
    .join('\n');

  // Format previous questions as explicit list
  const allPriorQuestions = [...previousQuestions, ...priorLightingQuestions];
  const priorQuestionsBlock = allPriorQuestions.length > 0
    ? `ALREADY ASKED (DO NOT REPEAT, REPHRASE, OR ASK SIMILAR):\n${allPriorQuestions.map((q, i) => `${i + 1}. "${q.question}" (${q.leftText} vs ${q.rightText})`).join('\n')}`
    : 'No prior questions yet.';

  // All mini-games played for variety tracking
  const miniGamesPlayedBlock = (allMiniGamesPlayed || []).length > 0
    ? `Mini-games played this session:\n${allMiniGamesPlayed.map(g => `- ${g.type} (${g.playerName})`).join('\n')}`
    : '';

  // Transition responses (insight collection)
  const transitionResponsesBlock = (transitionResponses || []).length > 0
    ? `Insight collection responses:\n${JSON.stringify(transitionResponses, null, 2)}`
    : '';

  return `You are THE LIGHTING ROUND HOST for Family Glitch.

CURRENT GAME: lighting_round
Round ${roundIndex} of ${totalRounds}. Timer: ${seconds} seconds.

Current player: ${targetName}${targetAge ? ` (age ${targetAge})` : ''}, role: ${targetRole}

Your job: Write ONE UNIQUE timed binary question about a specific family member.
Use the full game data to choose a question with a CLEAR correct answer.
Make it a "how well do you know them?" guess, not a memory test.

Players (use these exact IDs when referencing people):
${playerList || 'No players listed.'}

Scores:
${JSON.stringify(scores || {}, null, 2)}

## FULL GAME DATA (Use for personalization)
Full turn history (ALL turns - read EVERYTHING to find unique question angles):
${JSON.stringify(turns || [], null, 2)}

${transitionResponsesBlock}

## CRITICAL: NO REPEATS
${priorQuestionsBlock}

${miniGamesPlayedBlock}

## UNIQUENESS RULES (MANDATORY)
1. NEVER repeat a question that was already asked (check the list above)
2. NEVER ask a similar question with different wording (e.g., if "Who likes pizza?" was asked, don't ask "Who loves Italian food?")
3. NEVER ask about the same person + trait combination twice
4. VARY the question STYLE:
   - "Who is most likely to..." questions
   - "Who said they..." questions
   - "Who would rather..." questions
   - "Whose favorite is..." questions
5. VARY the SUBJECTS: ask about different family members
6. VARY the TOPICS: hobbies, food, entertainment, personality, habits, preferences
7. Look for UNUSED data in the turns - find facts that haven't been asked about yet

## Rules:
- ONE question only.
- Must be binary: two options (left/right). No "neither".
- The correctChoice MUST be "left" or "right".
- Options should be short (1-3 words each).
- Question should be short (under ~12 words).
- Use data from turns to justify the correct answer.
- Avoid asking about the current player's own answer unless needed.

Return ONLY valid JSON:
{
  "question": "Who is most likely to binge true crime?",
  "leftText": "Mom",
  "rightText": "Dad",
  "correctChoice": "left",
  "subjectPlayerId": "player-id",
  "subjectPlayerName": "Mom",
  "evidence": "Mom said she loves true crime podcasts.",
  "commentaryCorrect": "Nailed it. You know your people.",
  "commentaryWrong": "Nope. Mom is the true crime fiend.",
  "commentaryPass": "Strategic pass. Living to fight on."
}

REMEMBER: This question MUST be completely different from all ${allPriorQuestions.length} prior questions!`;
}

/**
 * Parse a Lighting Round question response from the AI.
 *
 * Note: Lighting Round uses a 1-turn AI pattern (not the typical 2-turn pattern).
 * The AI generates the question WITH all commentary variants (correct/wrong/pass) upfront.
 * Client-side scoring validates answers and selects the appropriate pre-written commentary.
 * This is more efficient for binary questions with objective answers (5 AI calls vs 10).
 */
export function parseLightingRoundQuestionResponse(
  text: string
): LightingRoundQuestionResponse | null {
  const parsed = extractAndParseJSON<LightingRoundQuestionResponse>(text);
  if (!parsed) return null;

  const correctChoice = (parsed.correctChoice || '').toLowerCase();
  if (correctChoice !== 'left' && correctChoice !== 'right') return null;

  if (!parsed.question || !parsed.leftText || !parsed.rightText) return null;

  return {
    question: parsed.question.trim(),
    leftText: parsed.leftText.trim(),
    rightText: parsed.rightText.trim(),
    correctChoice: correctChoice as 'left' | 'right',
    subjectPlayerId: parsed.subjectPlayerId,
    subjectPlayerName: parsed.subjectPlayerName,
    evidence: parsed.evidence,
    commentaryCorrect: parsed.commentaryCorrect || 'Nailed it.',
    commentaryWrong: parsed.commentaryWrong || 'Oof. Not quite.',
    commentaryPass: parsed.commentaryPass || 'Pass logged.',
  };
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
