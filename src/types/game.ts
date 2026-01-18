// ============================================
// FAMILY GLITCH - SYSTEMS-FIRST ARCHITECTURE
// ============================================

// -----------------
// GAME PHASES & ARC
// -----------------

export type GamePhase = 'SETUP' | 'PLAYING' | 'FINALE';

export type GameAct = 'ACT_1' | 'ACT_2' | 'ACT_3';

export interface GameArc {
  current_act: GameAct;
  act_1_range: [number, number];  // [1, 4]
  act_2_range: [number, number];  // [5, 8]
  act_3_range: [number, number];  // [9, 12]
}

// -----------------
// PLAYER METADATA
// -----------------

export type FamilyRelationship =
  | 'mom'
  | 'dad'
  | 'son'
  | 'daughter'
  | 'aunt'
  | 'uncle'
  | 'cousin'
  | 'brother'
  | 'sister'
  | 'grandma'
  | 'grandpa'
  | 'friend'
  | 'other';

export interface Player {
  id: string;
  name: string;
  age?: number;
  relationship?: FamilyRelationship;
  score: number;
  avatar: string; // Generated image URL or emoji
}

// -----------------
// STORAGE SUBSYSTEM
// -----------------

export type StorageScope = 'permanent' | 'turn' | 'deferred';

export type DataType = 'text' | 'choice' | 'multi_choice' | 'rating' | 'numeric' | 'media_url';

export interface StoredData {
  id: string;
  value: string | string[] | number; // Text, choices, rating, or URL
  input_type: DataType;
  question: string;
  source_player_id: string;
  target_player_id?: string; // For cross-player requests
  scope: StorageScope;
  tags: string[]; // ['mad_libs_noun', 'horse_racing', 'caption', etc.]
  turn_collected: number;
  metadata?: Record<string, any>;
}

// -----------------
// VOTING/RATING SUBSYSTEM
// -----------------

export type RatingDimension = 'accuracy' | 'funniness' | 'cleverness' | 'overall';

export interface RatingRequest {
  dimensions: RatingDimension[]; // Which sliders to show
  min_value: number; // Default 1
  max_value: number; // Default 5
  target_data_id: string; // What StoredData is being rated
  prompt: string; // "Rate how funny this caption is"
}

export interface RatingResult {
  data_id: string;
  rater_player_id: string;
  ratings: Record<RatingDimension, number>; // { funniness: 4, cleverness: 3 }
  turn_rated: number;
}

// -----------------
// INPUT INTERFACES
// -----------------

export type InputInterface =
  | 'THE_SECRET_CONFESSIONAL' // Text input
  | 'THE_GALLERY' // Display ASCII/art with optional input
  | 'THE_SELECTOR' // Multiple choice
  | 'THE_HANDOFF' // Pass to next player
  | 'THE_IMAGE_GENERATOR' // Display generated image
  | 'THE_RATING_SCREEN'; // Multi-dimensional rating sliders

export interface InterfaceConfig {
  type: InputInterface;
  data: InterfaceData;
}

export type InterfaceData =
  | ConfessionalData
  | GalleryData
  | SelectorData
  | HandoffData
  | ImageGeneratorData
  | RatingScreenData;

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
  prompt?: string;
  show_input?: boolean;
}

export interface SelectorData {
  question: string;
  options: string[];
  allow_multi_select?: boolean;
  correct_answer?: string;
}

export interface HandoffData {
  next_player_name: string;
  next_player_avatar: string;
  hint?: string;
  require_unlock: boolean;
}

export interface ImageGeneratorData {
  image_url: string;
  prompt_used?: string;
  task: 'caption' | 'identify' | 'guess_obscured';
  caption_prompt?: string;
  obscured_hint?: string;
}

export interface RatingScreenData {
  dimensions: RatingDimension[]; // ['funniness', 'cleverness']
  min_value: number;
  max_value: number;
  target_content: string; // The text/caption being rated
  target_media_url?: string; // Optional image/video
  author_name: string;
  author_avatar: string;
  prompt: string;
}

// -----------------
// TURN ACTIONS (Multi-Step Turns)
// -----------------

export interface TurnAction {
  type: 'collect_data' | 'render_media' | 'rate_peer' | 'cross_player_request';
  interface: InputInterface;
  data: InterfaceData;
  requires_completion: boolean; // Must complete before next action
  stores_as?: {
    scope: StorageScope;
    tags: string[];
  };
}

// -----------------
// GAME CARTRIDGES
// -----------------

export type GameCartridge =
  | 'LETTER_CHAOS'
  | 'VAULT_RECALL'
  | 'CAPTION_THIS'
  | 'MAD_LIBS'
  | 'CONSENSUS';

export interface CartridgeMetadata {
  id: GameCartridge;
  name: string;
  description: string;
  min_players: number;
  requires_vault_facts: number; // Minimum facts needed
  allowed_in_acts: GameAct[]; // Which acts can this cartridge appear in
  complexity: 'low' | 'medium' | 'high';
  uses_subsystems: string[]; // ['storage', 'rating', 'cross_player']
}

// -----------------
// SCORING
// -----------------

export interface ScoreEvent {
  player_id: string;
  points: number;
  bonus: number;
  reason: string;
  turn: number;
  cartridge?: GameCartridge;
}

// -----------------
// GAME STATE
// -----------------

export interface GameMeta {
  turn_count: number;
  max_turns: number;
  current_player_index: number;
  phase: GamePhase;
  arc: GameArc;
  game_started_at: number;
  vibe: string; // Location/context
}

export interface CurrentTurn {
  player_id: string;
  cartridge?: GameCartridge; // Which game is being played
  actions: TurnAction[];
  current_action_index: number;
  temp_data: Record<string, any>; // Temporary storage for multi-step games
}

export interface GameState {
  meta: GameMeta;
  players: Player[];
  storage: StoredData[]; // Universal storage with scoping/tagging
  ratings: RatingResult[]; // All ratings given
  current_turn: CurrentTurn;
  score_history: ScoreEvent[];
}

// -----------------
// AI COMMUNICATION
// -----------------

export interface AIRequest {
  game_state: GameState;
  user_input?: string | string[] | Record<string, number>; // Text, choices, or ratings
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
    current_turn?: Partial<CurrentTurn>;
    storage?: StoredData[]; // Add new stored data
    ratings?: RatingResult[]; // Add new ratings
  };

  // Scoring
  score_event?: ScoreEvent;

  // Finale
  finale?: {
    winner_id: string;
    recap: string;
    highlights: string[];
  };
}

// -----------------
// CARTRIDGE DEFINITIONS
// -----------------

export const CARTRIDGE_LIBRARY: Record<GameCartridge, CartridgeMetadata> = {
  LETTER_CHAOS: {
    id: 'LETTER_CHAOS',
    name: 'Letter Chaos',
    description: 'Fill in 2 words using given letters',
    min_players: 2,
    requires_vault_facts: 0,
    allowed_in_acts: ['ACT_1', 'ACT_2'],
    complexity: 'low',
    uses_subsystems: ['storage'],
  },
  VAULT_RECALL: {
    id: 'VAULT_RECALL',
    name: 'Vault Recall',
    description: 'Trivia based on stored facts',
    min_players: 2,
    requires_vault_facts: 6,
    allowed_in_acts: ['ACT_2', 'ACT_3'],
    complexity: 'medium',
    uses_subsystems: ['storage'],
  },
  CAPTION_THIS: {
    id: 'CAPTION_THIS',
    name: 'Caption This',
    description: 'Write caption for generated image, others rate it',
    min_players: 3,
    requires_vault_facts: 0,
    allowed_in_acts: ['ACT_1', 'ACT_2', 'ACT_3'],
    complexity: 'medium',
    uses_subsystems: ['storage', 'rating', 'media_generation'],
  },
  MAD_LIBS: {
    id: 'MAD_LIBS',
    name: 'Mad Libs',
    description: 'Collect words from multiple players, generate story',
    min_players: 2,
    requires_vault_facts: 0,
    allowed_in_acts: ['ACT_2', 'ACT_3'],
    complexity: 'high',
    uses_subsystems: ['storage', 'cross_player', 'deferred_storage'],
  },
  CONSENSUS: {
    id: 'CONSENSUS',
    name: 'Consensus',
    description: 'Everyone answers same question, points for matching',
    min_players: 3,
    requires_vault_facts: 3,
    allowed_in_acts: ['ACT_2', 'ACT_3'],
    complexity: 'medium',
    uses_subsystems: ['storage'],
  },
};
