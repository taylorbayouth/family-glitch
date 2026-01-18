export type GamePhase =
  | 'SETUP'
  | 'HANDOFF'
  | 'SHADOW'
  | 'PLAY'
  | 'JUDGMENT'
  | 'FINALE';

export type MiniGame =
  | 'HIVE_MIND'
  | 'LETTER_CHAOS'
  | 'VENTRILOQUIST'
  | 'WAGER'
  | 'TRIBUNAL';

export interface Player {
  name: string;
  score: number;
  tags: string[];
}

export interface ShadowData {
  adjectives: string[];
  verbs: string[];
  nouns: string[];
  observations: string[];
}

export interface Challenge {
  type: 'input' | 'choice' | 'rating' | 'bid';
  prompt: string;
  targetPlayer?: string;
  options?: string[];
  minBid?: number;
  maxBid?: number;
  context?: string;
}

export interface GameMeta {
  turn: number;
  maxTurns: number;
  phase: GamePhase;
  currentPlayer: string;
  currentMiniGame: MiniGame | null;
  vibe: string;
}

export interface GameState {
  meta: GameMeta;
  players: Record<string, Player>;
  shadowData: ShadowData;
  history: string[];
  currentChallenge: Challenge | null;
  pendingAnswers: Record<string, string>;
  hiveMindQuestion?: string;
  ventriloquistAnswer?: string;
  ventriloquistTarget?: string;
  wagerBid?: number;
  wagerTopic?: string;
}

export interface ScoreUpdate {
  player: string;
  points: number;
  reason: string;
}

export interface AIDisplay {
  title: string;
  message: string;
  subtext?: string;
}

export interface AIResponse {
  gameState: GameState;
  display: AIDisplay;
  challenge?: Challenge;
  scoreUpdates?: ScoreUpdate[];
  poem?: string;
  nextPhase?: GamePhase;
}
