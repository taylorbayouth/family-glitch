/**
 * ============================================================================
 * FACTS DATABASE MANAGER
 * ============================================================================
 *
 * This module manages the "knowledge base" built during Act 1.
 * These facts are used by Act 2 cartridges to create personalized,
 * context-aware challenges.
 *
 * Key responsibilities:
 * - Store facts with proper indexing (by player, by category)
 * - Query facts efficiently (filter, search, sample)
 * - Maintain privacy levels (hidden vs revealed)
 * - Provide relevant context for cartridges
 *
 * Design principles:
 * - Immutable updates (return new DB, never mutate)
 * - Indexed for fast lookups
 * - Type-safe queries
 */

import { FactCard, FactsDB, FactCategory, Player, PrivacyLevel } from '@/types/game';
import { v4 as uuidv4 } from 'uuid';
import { ACT1 } from '@/lib/constants';

// ============================================================================
// DATABASE CREATION
// ============================================================================

/**
 * Create an empty facts database
 */
export function createFactsDB(): FactsDB {
  return {
    facts: [],
    byPlayer: {},
    byCategory: {
      observational: [],
      preference: [],
      behavioral: [],
      reasoning: [],
      hypothetical: [],
      estimation: [],
      values: [],
    },
  };
}

// ============================================================================
// ADD FACTS
// ============================================================================

/**
 * Add a fact to the database
 *
 * This automatically updates all indexes
 *
 * @param db - Current facts database
 * @param fact - Fact to add
 * @returns Updated database (immutable)
 */
export function addFact(db: FactsDB, fact: FactCard): FactsDB {
  // Create new fact array
  const facts = [...db.facts, fact];

  // Update player index
  const byPlayer = { ...db.byPlayer };
  if (!byPlayer[fact.targetPlayerId]) {
    byPlayer[fact.targetPlayerId] = [];
  }
  byPlayer[fact.targetPlayerId] = [...byPlayer[fact.targetPlayerId], fact.id];

  // Update category index
  const byCategory = { ...db.byCategory };
  if (!byCategory[fact.category]) {
    byCategory[fact.category] = [];
  }
  byCategory[fact.category] = [...byCategory[fact.category], fact.id];

  return {
    facts,
    byPlayer,
    byCategory,
  };
}

/**
 * Create a fact card from components
 *
 * Helper to build a complete FactCard object
 *
 * @param targetPlayerId - Who the fact is about
 * @param authorPlayerId - Who provided the fact
 * @param category - Fact category
 * @param question - The question asked
 * @param answer - The answer given
 * @param privacyLevel - When to reveal
 * @returns Complete fact card ready to store
 */
export function createFactCard(
  targetPlayerId: string,
  authorPlayerId: string,
  category: FactCategory,
  question: string,
  answer: string,
  privacyLevel: PrivacyLevel
): FactCard {
  return {
    id: uuidv4(),
    targetPlayerId,
    authorPlayerId,
    category,
    question,
    answer,
    privacyLevel,
    createdAt: Date.now(),
    revealedAt: null,
  };
}

/**
 * Add multiple facts at once
 *
 * More efficient than calling addFact repeatedly
 *
 * @param db - Current database
 * @param facts - Facts to add
 * @returns Updated database
 */
export function addFacts(db: FactsDB, facts: FactCard[]): FactsDB {
  let updatedDB = db;

  facts.forEach((fact) => {
    updatedDB = addFact(updatedDB, fact);
  });

  return updatedDB;
}

// ============================================================================
// QUERY FACTS
// ============================================================================

/**
 * Get all facts about a specific player
 *
 * @param db - Facts database
 * @param playerId - Target player ID
 * @returns Array of facts about that player
 */
export function getFactsByPlayer(db: FactsDB, playerId: string): FactCard[] {
  const factIds = db.byPlayer[playerId] || [];
  return factIds
    .map((id) => db.facts.find((f) => f.id === id))
    .filter((f): f is FactCard => f !== undefined);
}

/**
 * Get all facts in a specific category
 *
 * @param db - Facts database
 * @param category - Target category
 * @returns Array of facts in that category
 */
export function getFactsByCategory(
  db: FactsDB,
  category: FactCategory
): FactCard[] {
  const factIds = db.byCategory[category] || [];
  return factIds
    .map((id) => db.facts.find((f) => f.id === id))
    .filter((f): f is FactCard => f !== undefined);
}

/**
 * Get facts by multiple categories
 *
 * @param db - Facts database
 * @param categories - Categories to include
 * @returns Array of facts matching any category
 */
export function getFactsByCategories(
  db: FactsDB,
  categories: FactCategory[]
): FactCard[] {
  const facts: FactCard[] = [];
  const seenIds = new Set<string>();

  categories.forEach((category) => {
    const categoryFacts = getFactsByCategory(db, category);
    categoryFacts.forEach((fact) => {
      if (!seenIds.has(fact.id)) {
        facts.push(fact);
        seenIds.add(fact.id);
      }
    });
  });

  return facts;
}

/**
 * Get facts written by a specific player
 *
 * @param db - Facts database
 * @param authorId - Author player ID
 * @returns Array of facts authored by that player
 */
export function getFactsByAuthor(db: FactsDB, authorId: string): FactCard[] {
  return db.facts.filter((f) => f.authorPlayerId === authorId);
}

/**
 * Get all private facts (not yet revealed)
 *
 * Used in Act 3 for the reveal sequence
 *
 * @param db - Facts database
 * @returns Array of unrevealed facts
 */
export function getPrivateFacts(db: FactsDB): FactCard[] {
  return db.facts.filter(
    (f) => f.privacyLevel === 'private-until-act3' && !f.revealedAt
  );
}

/**
 * Get all revealed facts
 *
 * @param db - Facts database
 * @returns Array of revealed facts
 */
export function getRevealedFacts(db: FactsDB): FactCard[] {
  return db.facts.filter((f) => f.revealedAt !== null);
}

// ============================================================================
// SAMPLING & FILTERING
// ============================================================================

/**
 * Get a random sample of facts
 *
 * Useful for selecting diverse facts for cartridge context
 *
 * @param facts - Source facts array
 * @param count - How many to sample
 * @returns Random sample (no duplicates)
 */
export function sampleFacts(facts: FactCard[], count: number): FactCard[] {
  if (facts.length <= count) {
    return [...facts];
  }

  // Fisher-Yates shuffle and take first N
  const shuffled = [...facts];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

/**
 * Get most recent facts
 *
 * @param db - Facts database
 * @param count - How many recent facts
 * @returns Most recent facts (sorted by creation time)
 */
export function getRecentFacts(db: FactsDB, count: number): FactCard[] {
  return db.facts.slice(-count);
}

/**
 * Filter facts by privacy level
 *
 * @param facts - Facts to filter
 * @param privacyLevel - Target privacy level
 * @returns Filtered facts
 */
export function filterFactsByPrivacy(
  facts: FactCard[],
  privacyLevel: PrivacyLevel
): FactCard[] {
  return facts.filter((f) => f.privacyLevel === privacyLevel);
}

// ============================================================================
// REVEAL MANAGEMENT
// ============================================================================

/**
 * Mark a fact as revealed
 *
 * @param db - Facts database
 * @param factId - Fact to reveal
 * @returns Updated database
 */
export function revealFact(db: FactsDB, factId: string): FactsDB {
  const facts = db.facts.map((fact) =>
    fact.id === factId
      ? { ...fact, revealedAt: Date.now() }
      : fact
  );

  return {
    ...db,
    facts,
  };
}

/**
 * Mark multiple facts as revealed
 *
 * @param db - Facts database
 * @param factIds - Facts to reveal
 * @returns Updated database
 */
export function revealFacts(db: FactsDB, factIds: string[]): FactsDB {
  const idSet = new Set(factIds);
  const now = Date.now();

  const facts = db.facts.map((fact) =>
    idSet.has(fact.id)
      ? { ...fact, revealedAt: now }
      : fact
  );

  return {
    ...db,
    facts,
  };
}

/**
 * Reveal all private facts
 *
 * Used when entering Act 3
 *
 * @param db - Facts database
 * @returns Updated database
 */
export function revealAllPrivateFacts(db: FactsDB): FactsDB {
  const privateFacts = getPrivateFacts(db);
  const privateIds = privateFacts.map((f) => f.id);

  return revealFacts(db, privateIds);
}

// ============================================================================
// STATISTICS & ANALYSIS
// ============================================================================

/**
 * Get fact count by category
 *
 * Returns a map of { category: count }
 */
export function getFactCountsByCategory(
  db: FactsDB
): Record<FactCategory, number> {
  const counts: Partial<Record<FactCategory, number>> = {};

  db.facts.forEach((fact) => {
    counts[fact.category] = (counts[fact.category] || 0) + 1;
  });

  return counts as Record<FactCategory, number>;
}

/**
 * Get fact count by player
 *
 * Returns a map of { playerId: count }
 */
export function getFactCountsByPlayer(
  db: FactsDB,
  playerIds: string[]
): Record<string, number> {
  const counts: Record<string, number> = {};

  playerIds.forEach((id) => {
    counts[id] = (db.byPlayer[id] || []).length;
  });

  return counts;
}

/**
 * Check if we have enough facts to start Act 2
 *
 * @param db - Facts database
 * @param playerCount - Number of players
 * @returns true if sufficient facts gathered
 */
export function hasSufficientFacts(
  db: FactsDB,
  playerCount: number
): boolean {
  const targetFacts = Math.max(
    ACT1.MIN_FACTS,
    Math.ceil(playerCount * ACT1.TARGET_FACTS_PER_PLAYER)
  );

  return db.facts.length >= targetFacts;
}

/**
 * Get category diversity score (0-1)
 *
 * Higher score = better variety of fact categories
 * 1.0 = facts evenly distributed across all categories
 * 0.0 = all facts in one category
 */
export function getCategoryDiversity(db: FactsDB): number {
  if (db.facts.length === 0) return 0;

  const counts = getFactCountsByCategory(db);
  const categories = Object.keys(counts) as FactCategory[];

  if (categories.length === 0) return 0;

  // Calculate entropy (simplified)
  const total = db.facts.length;
  let entropy = 0;

  categories.forEach((cat) => {
    const p = counts[cat] / total;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  });

  // Normalize to 0-1 scale
  const maxEntropy = Math.log2(7); // 7 categories
  return entropy / maxEntropy;
}

/**
 * Get database summary statistics
 */
export function getDBSummary(db: FactsDB, players: Player[]): {
  totalFacts: number;
  byCategoryCount: Record<FactCategory, number>;
  byPlayerCount: Record<string, number>;
  privateCount: number;
  revealedCount: number;
  diversity: number;
} {
  return {
    totalFacts: db.facts.length,
    byCategoryCount: getFactCountsByCategory(db),
    byPlayerCount: getFactCountsByPlayer(
      db,
      players.map((p) => p.id)
    ),
    privateCount: getPrivateFacts(db).length,
    revealedCount: getRevealedFacts(db).length,
    diversity: getCategoryDiversity(db),
  };
}

// ============================================================================
// CARTRIDGE CONTEXT BUILDING
// ============================================================================

/**
 * Get relevant facts for a cartridge
 *
 * This is the key function that provides context to the LLM
 * for generating cartridge content.
 *
 * Strategy:
 * - Prefer facts matching desired categories
 * - Include recent facts (more memorable)
 * - Sample diverse players
 * - Limit total count (token budget)
 *
 * @param db - Facts database
 * @param preferredCategories - Categories to prioritize
 * @param maxCount - Maximum facts to return
 * @returns Relevant facts for cartridge
 */
export function getRelevantFactsForCartridge(
  db: FactsDB,
  preferredCategories?: FactCategory[],
  maxCount: number = 10
): FactCard[] {
  let candidates: FactCard[];

  if (preferredCategories && preferredCategories.length > 0) {
    // Get facts from preferred categories
    candidates = getFactsByCategories(db, preferredCategories);
  } else {
    // Use all facts
    candidates = db.facts;
  }

  // If we don't have enough, just return what we have
  if (candidates.length <= maxCount) {
    return candidates;
  }

  // Sample intelligently: mix of recent and random
  const recentCount = Math.ceil(maxCount * 0.4); // 40% recent
  const randomCount = maxCount - recentCount;

  const recent = candidates.slice(-recentCount);
  const remaining = candidates.slice(0, -recentCount);
  const random = sampleFacts(remaining, randomCount);

  return [...recent, ...random];
}
