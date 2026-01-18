// ============================================
// FAMILY GLITCH V2 - SYSTEM ARCHITECTURE
// ============================================

// -----------------
// CORE GAME STATE
// -----------------

export type GamePhase =
  | 'SETUP'           // Initial player setup
  | 'PASS_SCREEN'     // "Pass to [Player]" with unlock
  | 'DATA_TAX'        // Building The Vault
  | 'MINI_GAME'       // Playing a cartridge
  | 'SCORING'         // Showing points awarded
  | 'FINALE';         // End game reveal

export type MiniGame =
  | 'LETTER_CHAOS'    // Fill in 2 words with given letters
  | 'ASCII_RORSCHACH' // Describe/guess ASCII art
  | 'VAULT_RECALL'    // Trivia from stored facts
  | 'FAMILY_FEUD';    // Group voting/guessing

export interface Player {
  id: string;
  name: string;
  score: number;
  avatar: string;     // Emoji or image URL
}

export interface VaultFact {
  fact: string;       // The actual answer/content
  question: string;   // The question that was asked
  source: string;     // Player ID who provided it
  type: 'lore' | 'preference' | 'history' | 'opinion';
  turn: number;       // When it was collected
}

export interface GameMeta {
  turn_count: number;
  max_turns: number;
  current_player_index: number;
  phase: GamePhase;
  game_started_at: number;
  vibe: string;       // Location/context
}

export interface CurrentTurnData {
  mini_game: MiniGame | null;
  step: number;                   // Multi-step games (1, 2, 3...)
  secret_letters?: string[];      // For Letter Chaos
  context_sentence?: string;      // For Letter Chaos
  ascii_art?: string;             // For Rorschach
  secret_answer?: string;         // Hidden answer for guessing
  options?: string[];             // Multiple choice options
  trivia_question?: string;       // For Vault Recall
  expected_answer?: string;       // For validation
  player_a_id?: string;           // For 2-player games
  player_b_id?: string;
  collected_answer?: string;      // Temporary storage
}

export interface GameState {
  meta: GameMeta;
  players: Player[];
  the_vault: VaultFact[];
  current_turn_data: CurrentTurnData;
  score_history: ScoreEvent[];
}

export interface ScoreEvent {
  player_id: string;
  points: number;
  bonus: number;
  reason: string;
  turn: number;
  mini_game: MiniGame;
}

// -----------------
// INPUT INTERFACES
// -----------------

export type InputInterface =
  | 'THE_SECRET_CONFESSIONAL'
  | 'THE_GALLERY'
  | 'THE_SELECTOR'
  | 'THE_HANDOFF';

export interface InterfaceConfig {
  type: InputInterface;
  data: InterfaceData;
}

export type InterfaceData =
  | ConfessionalData
  | GalleryData
  | SelectorData
  | HandoffData;

export interface ConfessionalData {
  question: string;
  placeholder?: string;
  min_length?: number;
  max_length?: number;
  helper_text?: string;
}

export interface GalleryData {
  art_string: string;
  caption?: string;
  prompt?: string;           // "What does this remind you of?"
  show_input?: boolean;      // Show text input below art
}

export interface SelectorData {
  question: string;
  options: string[];
  allow_multi_select?: boolean;
  correct_answer?: string;   // For validation (hidden from UI)
}

export interface HandoffData {
  next_player_name: string;
  next_player_avatar: string;
  hint?: string;             // Optional tease
  require_unlock: boolean;
}

// -----------------
// AI COMMUNICATION
// -----------------

export interface AIRequest {
  game_state: GameState;
  user_input?: string | string[];  // Can be single value or array for multi-select
  input_type?: string;
}

export interface AIResponse {
  // What to show the user
  display: {
    title: string;
    message: string;
    subtext?: string;
  };

  // What interface to render
  interface?: InterfaceConfig;

  // State updates
  updates?: {
    phase?: GamePhase;
    turn_count?: number;
    current_player_index?: number;
    current_turn_data?: Partial<CurrentTurnData>;
    the_vault?: VaultFact[];
  };

  // Scoring
  score_event?: ScoreEvent;

  // Finale
  finale?: {
    winner_id: string;
    recap: string;          // Fun summary of the game
    highlights: string[];   // Funny moments
  };
}

// -----------------
// ANIMATION CONFIGS
// -----------------

export interface AnimationConfig {
  vault_deposit: {
    duration: number;
    easing: string;
  };
  score_reveal: {
    count_up_speed: number;
    confetti_threshold: number;
  };
  handoff_unlock: {
    slide_threshold: number;
  };
}
