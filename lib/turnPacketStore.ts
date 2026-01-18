/**
 * ============================================================================
 * TURN PACKET STORE - Turn Lifecycle Management
 * ============================================================================
 *
 * This module manages the collection of TurnPackets for a session.
 * It provides:
 * - CRUD operations (create, read, update)
 * - Indexed queries (by act, player, cartridge, etc.)
 * - Statistics and analytics
 * - Act 3 highlight selection
 *
 * Design principles:
 * - Immutable updates (return new store)
 * - Indexed for fast lookups
 * - Type-safe operations
 */

import { v4 as uuidv4 } from 'uuid';
import {
  TurnPacket,
  TurnPacketStore,
  PromptArtifact,
  RelevanceMeta,
  TurnRules,
  RevealMeta,
  Submission,
  ScoringRecord,
} from '@/types/turnPacket';
import { ActNumber } from '@/types/game';

// ============================================================================
// STORE CREATION
// ============================================================================

/**
 * Create an empty turn packet store
 */
export function createTurnPacketStore(): TurnPacketStore {
  return {
    packets: [],
    byId: {},
    byAct: {
      1: [],
      2: [],
      3: [],
    },
    byCartridge: {},
    byPlayer: {},
    byHighlight: {},
  };
}

// ============================================================================
// ADD TURNS
// ============================================================================

/**
 * Create a new turn packet
 *
 * @param params - Turn packet parameters
 * @returns Complete turn packet with generated ID
 */
export function createTurnPacket(params: {
  act: ActNumber;
  roundIndex: number;
  turnIndex: number;
  cartridgeId: string;
  activePlayerId: string;
  targetPlayerIds?: string[];
  prompt: PromptArtifact;
  relevance: RelevanceMeta;
  rules: TurnRules;
  reveal: RevealMeta;
}): TurnPacket {
  return {
    id: uuidv4(),
    createdAt: Date.now(),
    act: params.act,
    roundIndex: params.roundIndex,
    turnIndex: params.turnIndex,
    cartridgeId: params.cartridgeId,
    activePlayerId: params.activePlayerId,
    targetPlayerIds: params.targetPlayerIds,
    prompt: params.prompt,
    relevance: params.relevance,
    rules: params.rules,
    submissions: [],
    scoring: null,
    reveal: params.reveal,
  };
}

/**
 * Add a turn packet to the store
 *
 * @param store - Current store
 * @param packet - Turn packet to add
 * @returns Updated store (immutable)
 */
export function addTurnPacket(
  store: TurnPacketStore,
  packet: TurnPacket
): TurnPacketStore {
  // Add to main array
  const packets = [...store.packets, packet];

  // Update byId index
  const byId = { ...store.byId, [packet.id]: packet };

  // Update byAct index
  const byAct = { ...store.byAct };
  if (!byAct[packet.act]) {
    byAct[packet.act] = [];
  }
  byAct[packet.act] = [...byAct[packet.act], packet.id];

  // Update byCartridge index
  const byCartridge = { ...store.byCartridge };
  if (!byCartridge[packet.cartridgeId]) {
    byCartridge[packet.cartridgeId] = [];
  }
  byCartridge[packet.cartridgeId] = [
    ...byCartridge[packet.cartridgeId],
    packet.id,
  ];

  // Update byPlayer index
  const byPlayer = { ...store.byPlayer };
  if (!byPlayer[packet.activePlayerId]) {
    byPlayer[packet.activePlayerId] = [];
  }
  byPlayer[packet.activePlayerId] = [
    ...byPlayer[packet.activePlayerId],
    packet.id,
  ];

  // Update byHighlight index (if tags present)
  const byHighlight = { ...store.byHighlight };
  if (packet.highlightTags) {
    packet.highlightTags.forEach((tag) => {
      if (!byHighlight[tag]) {
        byHighlight[tag] = [];
      }
      byHighlight[tag] = [...byHighlight[tag], packet.id];
    });
  }

  return {
    packets,
    byId,
    byAct,
    byCartridge,
    byPlayer,
    byHighlight,
  };
}

// ============================================================================
// UPDATE TURNS
// ============================================================================

/**
 * Update a turn packet in the store
 *
 * @param store - Current store
 * @param turnId - Turn ID to update
 * @param updates - Partial updates to apply
 * @returns Updated store (immutable)
 */
export function updateTurnPacket(
  store: TurnPacketStore,
  turnId: string,
  updates: Partial<TurnPacket>
): TurnPacketStore {
  const existingPacket = store.byId[turnId];
  if (!existingPacket) {
    console.error(`Turn packet ${turnId} not found`);
    return store;
  }

  // Merge updates
  const updatedPacket: TurnPacket = {
    ...existingPacket,
    ...updates,
  };

  // Update in all indexes
  const packets = store.packets.map((p) =>
    p.id === turnId ? updatedPacket : p
  );

  const byId = { ...store.byId, [turnId]: updatedPacket };

  // Note: Other indexes don't change on update (only byId and packets array)

  return {
    ...store,
    packets,
    byId,
  };
}

/**
 * Add a submission to a turn packet
 *
 * @param store - Current store
 * @param turnId - Turn ID
 * @param submission - Submission to add
 * @returns Updated store
 */
export function addSubmission(
  store: TurnPacketStore,
  turnId: string,
  submission: Submission
): TurnPacketStore {
  const packet = store.byId[turnId];
  if (!packet) return store;

  const submissions = [...packet.submissions, submission];

  return updateTurnPacket(store, turnId, { submissions });
}

/**
 * Add scoring to a turn packet
 *
 * @param store - Current store
 * @param turnId - Turn ID
 * @param scoring - Scoring record
 * @returns Updated store
 */
export function addScoring(
  store: TurnPacketStore,
  turnId: string,
  scoring: ScoringRecord
): TurnPacketStore {
  return updateTurnPacket(store, turnId, { scoring });
}

/**
 * Add highlight tags to a turn
 *
 * @param store - Current store
 * @param turnId - Turn ID
 * @param tags - Tags to add
 * @returns Updated store
 */
export function addHighlightTags(
  store: TurnPacketStore,
  turnId: string,
  tags: string[]
): TurnPacketStore {
  const packet = store.byId[turnId];
  if (!packet) return store;

  const existingTags = packet.highlightTags || [];
  const highlightTags = [...new Set([...existingTags, ...tags])];

  // Update indexes
  const byHighlight = { ...store.byHighlight };
  tags.forEach((tag) => {
    if (!byHighlight[tag]) {
      byHighlight[tag] = [];
    }
    if (!byHighlight[tag].includes(turnId)) {
      byHighlight[tag] = [...byHighlight[tag], turnId];
    }
  });

  const updatedStore = updateTurnPacket(store, turnId, { highlightTags });

  return {
    ...updatedStore,
    byHighlight,
  };
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get a turn packet by ID
 */
export function getTurnPacket(
  store: TurnPacketStore,
  turnId: string
): TurnPacket | null {
  return store.byId[turnId] || null;
}

/**
 * Get all turns in a specific act
 */
export function getTurnsByAct(
  store: TurnPacketStore,
  act: ActNumber
): TurnPacket[] {
  const ids = store.byAct[act] || [];
  return ids
    .map((id) => store.byId[id])
    .filter((p): p is TurnPacket => p !== undefined);
}

/**
 * Get all turns for a specific cartridge
 */
export function getTurnsByCartridge(
  store: TurnPacketStore,
  cartridgeId: string
): TurnPacket[] {
  const ids = store.byCartridge[cartridgeId] || [];
  return ids
    .map((id) => store.byId[id])
    .filter((p): p is TurnPacket => p !== undefined);
}

/**
 * Get all turns for a specific player
 */
export function getTurnsByPlayer(
  store: TurnPacketStore,
  playerId: string
): TurnPacket[] {
  const ids = store.byPlayer[playerId] || [];
  return ids
    .map((id) => store.byId[id])
    .filter((p): p is TurnPacket => p !== undefined);
}

/**
 * Get all turns with a specific highlight tag
 */
export function getTurnsByHighlight(
  store: TurnPacketStore,
  tag: string
): TurnPacket[] {
  const ids = store.byHighlight[tag] || [];
  return ids
    .map((id) => store.byId[id])
    .filter((p): p is TurnPacket => p !== undefined);
}

/**
 * Get the most recent N turns
 */
export function getRecentTurns(
  store: TurnPacketStore,
  count: number
): TurnPacket[] {
  return store.packets.slice(-count);
}

/**
 * Get turns that have been scored
 */
export function getScoredTurns(store: TurnPacketStore): TurnPacket[] {
  return store.packets.filter((p) => p.scoring !== null);
}

/**
 * Get turns that are not yet scored
 */
export function getUnscoredTurns(store: TurnPacketStore): TurnPacket[] {
  return store.packets.filter((p) => p.scoring === null);
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get turn count statistics
 */
export function getTurnStats(store: TurnPacketStore): {
  total: number;
  byAct: Record<ActNumber, number>;
  byCartridge: Record<string, number>;
  byPlayer: Record<string, number>;
  scored: number;
  unscored: number;
} {
  const byAct: Record<ActNumber, number> = {
    1: (store.byAct[1] || []).length,
    2: (store.byAct[2] || []).length,
    3: (store.byAct[3] || []).length,
  };

  const byCartridge: Record<string, number> = {};
  Object.keys(store.byCartridge).forEach((id) => {
    byCartridge[id] = store.byCartridge[id].length;
  });

  const byPlayer: Record<string, number> = {};
  Object.keys(store.byPlayer).forEach((id) => {
    byPlayer[id] = store.byPlayer[id].length;
  });

  return {
    total: store.packets.length,
    byAct,
    byCartridge,
    byPlayer,
    scored: getScoredTurns(store).length,
    unscored: getUnscoredTurns(store).length,
  };
}

// ============================================================================
// ACT 3 HIGHLIGHTS
// ============================================================================

/**
 * Select highlight turns for Act 3
 *
 * Chooses the best turns for each highlight category
 *
 * @param store - Turn packet store
 * @param categories - Highlight categories to select
 * @returns Map of category → turn packet
 */
export function selectHighlights(
  store: TurnPacketStore,
  categories: string[]
): Record<string, TurnPacket | null> {
  const highlights: Record<string, TurnPacket | null> = {};

  categories.forEach((category) => {
    const turns = getTurnsByHighlight(store, category);

    if (turns.length === 0) {
      highlights[category] = null;
    } else {
      // Select the turn with the highest score for this category
      const sorted = turns.sort((a, b) => {
        const aScore = calculateTurnScore(a);
        const bScore = calculateTurnScore(b);
        return bScore - aScore;
      });

      highlights[category] = sorted[0];
    }
  });

  return highlights;
}

/**
 * Calculate total score for a turn (helper)
 */
function calculateTurnScore(turn: TurnPacket): number {
  if (!turn.scoring) return 0;

  return turn.scoring.entries.reduce((total, entry) => {
    const dimensionScores = Object.values(entry.scores).reduce(
      (sum, score) => sum + score,
      0
    );
    const bonus = entry.bonus || 0;
    return total + dimensionScores + bonus;
  }, 0);
}

// ============================================================================
// EXPORT / DEBUG
// ============================================================================

/**
 * Export store as JSON (for debugging/session export)
 */
export function exportStore(store: TurnPacketStore): string {
  return JSON.stringify(store, null, 2);
}

/**
 * Get a summary of the store (for debugging)
 */
export function getStoreSummary(store: TurnPacketStore): string {
  const stats = getTurnStats(store);

  const lines: string[] = [
    'Turn Packet Store Summary:',
    `  Total turns: ${stats.total}`,
    '',
    'By Act:',
    `  Act 1: ${stats.byAct[1]}`,
    `  Act 2: ${stats.byAct[2]}`,
    `  Act 3: ${stats.byAct[3]}`,
    '',
    `Scored: ${stats.scored} / ${stats.total}`,
    '',
    'Highlight tags:',
  ];

  Object.keys(store.byHighlight).forEach((tag) => {
    lines.push(`  ${tag}: ${store.byHighlight[tag].length} turns`);
  });

  return lines.join('\n');
}
