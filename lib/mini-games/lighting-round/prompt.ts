/**
 * Lighting Round - AI Prompts
 *
 * Generates one timed binary question at a time.
 * Uses full game context + local question history to avoid repeats.
 */

import type { Turn } from '@/lib/types/game-state';
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
  scores: Record<string, number>;
  roundIndex: number;
  totalRounds: number;
  seconds: number;
  previousQuestions: LightingRoundHistoryItem[];
  priorLightingQuestions: LightingRoundHistoryItem[];
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
    scores,
    roundIndex,
    totalRounds,
    seconds,
    previousQuestions,
    priorLightingQuestions,
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

  const historyBlock = previousQuestions.length > 0
    ? JSON.stringify(previousQuestions, null, 2)
    : '[]';

  const priorLightingBlock = priorLightingQuestions.length > 0
    ? JSON.stringify(priorLightingQuestions, null, 2)
    : '[]';

  return `You are THE LIGHTING ROUND HOST for Family Glitch.

Round ${roundIndex} of ${totalRounds}. Timer: ${seconds} seconds.

Current player: ${targetName}${targetAge ? ` (age ${targetAge})` : ''}, role: ${targetRole}

Your job: Write ONE timed binary question about a specific family member.
Use the full game data to choose a question with a CLEAR correct answer.
Make it a "how well do you know them?" guess, not a memory test.

Players (use these exact IDs when referencing people):
${playerList || 'No players listed.'}

Scores:
${JSON.stringify(scores || {}, null, 2)}

Full turn history (ALL turns, do not ignore anything):
${JSON.stringify(turns || [], null, 2)}

Local Lighting Round history (asked this session, with answers):
${historyBlock}

Prior Lighting Round questions from earlier turns:
${priorLightingBlock}

Rules:
- ONE question only.
- Must be binary: two options (left/right). No "neither".
- The correctChoice MUST be "left" or "right".
- Options should be short (1-3 words each).
- Question should be short (under ~12 words).
- Use data from turns to justify the correct answer.
- Do NOT repeat or rephrase any prior Lighting Round questions.
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
}`;
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
