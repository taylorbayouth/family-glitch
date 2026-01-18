/**
 * ============================================================================
 * CARTRIDGE REGISTRY - Central Registration System
 * ============================================================================
 *
 * This module maintains the registry of all available cartridges.
 * It provides:
 * - Registration of cartridges
 * - Query by ID, tags, requirements
 * - Filtering by context (runnable cartridges)
 * - Selection logic (LLM-powered or heuristic)
 *
 * Usage:
 * ```typescript
 * import { cartridgeRegistry } from '@/lib/cartridgeRegistry';
 * import { triviaCartridge } from '@/components/cartridges/TriviaCartridge';
 *
 * // Register cartridges
 * cartridgeRegistry.register(triviaCartridge);
 *
 * // Get runnable cartridges
 * const available = cartridgeRegistry.getRunnable(context);
 *
 * // Select next cartridge
 * const next = await cartridgeRegistry.selectNext(context, true);
 * ```
 */

import {
  CartridgeDefinition,
  CartridgeContext,
  CartridgeRegistry,
  CartridgeSelectionRequest,
  CartridgeSelectionResponse,
} from '@/types/cartridge';
import { triviaCartridge } from '@/components/cartridges/TriviaCartridge';
import { wouldYouRatherCartridge } from '@/components/cartridges/WouldYouRatherCartridge';

/**
 * Create cartridge registry instance
 */
function createCartridgeRegistry(): CartridgeRegistry {
  const cartridges = new Map<string, CartridgeDefinition>();

  return {
    cartridges,

    /**
     * Register a cartridge
     */
    register(cartridge: CartridgeDefinition) {
      if (cartridges.has(cartridge.id)) {
        console.warn(
          `Cartridge ${cartridge.id} already registered. Overwriting.`
        );
      }

      cartridges.set(cartridge.id, cartridge);
      console.log(`✅ Registered cartridge: ${cartridge.name} (${cartridge.id})`);
    },

    /**
     * Get cartridge by ID
     */
    get(id: string) {
      return cartridges.get(id);
    },

    /**
     * Get all runnable cartridges for current context
     *
     * Filters cartridges by:
     * - Player count requirements
     * - Fact requirements
     * - canRun() check
     */
    getRunnable(context: CartridgeContext): CartridgeDefinition[] {
      const playerCount = context.players.length;
      const factCount = context.factsDB.facts.length;

      return Array.from(cartridges.values()).filter((cartridge) => {
        // Check player count
        if (playerCount < cartridge.minPlayers) {
          return false;
        }
        if (playerCount > cartridge.maxPlayers) {
          return false;
        }

        // Check fact requirements
        if (cartridge.minFacts && factCount < cartridge.minFacts) {
          return false;
        }

        // Check required categories
        if (cartridge.requiredFactCategories) {
          const availableCategories = Object.keys(context.factsDB.byCategory);
          const hasAllCategories = cartridge.requiredFactCategories.every(
            (cat) => availableCategories.includes(cat)
          );
          if (!hasAllCategories) {
            return false;
          }
        }

        // Check cartridge-specific logic
        return cartridge.canRun(context);
      });
    },

    /**
     * Select next cartridge (LLM-powered or heuristic)
     *
     * @param context - Game context
     * @param useLLM - Use LLM for selection (vs simple heuristic)
     */
    async selectNext(
      context: CartridgeContext,
      useLLM: boolean
    ): Promise<CartridgeDefinition | null> {
      const runnable = this.getRunnable(context);

      if (runnable.length === 0) {
        console.warn('No runnable cartridges found');
        return null;
      }

      if (runnable.length === 1) {
        return runnable[0];
      }

      if (useLLM) {
        return selectWithLLM(context, runnable);
      } else {
        return selectWithHeuristic(context, runnable);
      }
    },
  };
}

/**
 * Select cartridge using LLM
 *
 * The LLM considers:
 * - Available facts and their content
 * - Recent cartridge history (avoid repetition)
 * - Current player dynamics
 * - Time remaining
 * - Relevance scores
 */
async function selectWithLLM(
  context: CartridgeContext,
  candidates: CartridgeDefinition[]
): Promise<CartridgeDefinition> {
  // Calculate relevance scores
  const candidatesWithScores = candidates.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    relevanceScore: c.getRelevanceScore(context),
    estimatedDuration: c.estimatedDuration,
  }));

  // Get recent cartridge history
  const recentCartridges = getRecentCartridgeIds(context.eventLog, 3);

  // Build LLM request
  const request: CartridgeSelectionRequest = {
    candidates: candidatesWithScores,
    context: {
      playerCount: context.players.length,
      factCount: context.factsDB.facts.length,
      recentCartridges,
      timeRemaining: context.remainingTime,
      currentScores: context.currentScores,
    },
  };

  try {
    // Call LLM (using the game's requestLLM helper)
    const response = await context.requestLLM({
      purpose: 'generate-content',
      context: {
        cartridgeId: 'selector',
        cartridgeName: 'Cartridge Selector',
        currentPhase: 'selection',
        selectionRequest: request,
      },
      instructions: `Select the best cartridge for this moment in the game.

Available cartridges:
${candidatesWithScores.map((c) => `- ${c.name} (${c.description}) [relevance: ${c.relevanceScore.toFixed(2)}]`).join('\n')}

Recent cartridges played: ${recentCartridges.join(', ') || 'none'}
Time remaining: ${Math.round(context.remainingTime / 60000)} minutes

Choose a cartridge that:
1. Hasn't been played recently (avoid back-to-back repeats)
2. Fits the time remaining
3. Uses the facts we've gathered effectively
4. Maintains game momentum

Respond with the cartridge ID and your reasoning.`,
    });

    // Parse response
    const selection = parseCartridgeSelection(response);

    // Find cartridge
    const selected = candidates.find((c) => c.id === selection.selectedId);

    if (!selected) {
      console.warn(
        `LLM selected invalid cartridge: ${selection.selectedId}. Falling back to heuristic.`
      );
      return selectWithHeuristic(context, candidates);
    }

    console.log(`🎮 LLM selected: ${selected.name}`);
    console.log(`   Reasoning: ${selection.reasoning}`);

    return selected;
  } catch (error) {
    console.error('LLM cartridge selection failed:', error);
    console.log('Falling back to heuristic selection');
    return selectWithHeuristic(context, candidates);
  }
}

/**
 * Select cartridge using simple heuristic
 *
 * Strategy:
 * 1. Filter out recently played cartridges
 * 2. Calculate relevance scores
 * 3. Add randomness to prevent predictability
 * 4. Select highest scoring cartridge
 */
function selectWithHeuristic(
  context: CartridgeContext,
  candidates: CartridgeDefinition[]
): CartridgeDefinition {
  const recentIds = getRecentCartridgeIds(context.eventLog, 2);

  // Calculate weighted scores
  const scored = candidates.map((cartridge) => {
    let score = cartridge.getRelevanceScore(context);

    // Penalty for recent play
    if (recentIds.includes(cartridge.id)) {
      score *= 0.3; // 70% penalty
    }

    // Bonus for fitting time remaining
    const timeRatio = cartridge.estimatedDuration / context.remainingTime;
    if (timeRatio > 0.3 && timeRatio < 0.7) {
      score *= 1.2; // 20% bonus for good fit
    }

    // Add small randomness (10% variance)
    score *= 0.95 + Math.random() * 0.1;

    return { cartridge, score };
  });

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  const selected = scored[0].cartridge;

  console.log(`🎮 Heuristic selected: ${selected.name} (score: ${scored[0].score.toFixed(2)})`);

  return selected;
}

/**
 * Get recent cartridge IDs from event log
 */
function getRecentCartridgeIds(eventLog: any, count: number): string[] {
  // Find cartridge_started events
  const cartridgeEvents = eventLog.events.filter(
    (e: any) => e.type === 'CARTRIDGE_STARTED'
  );

  // Get last N
  return cartridgeEvents
    .slice(-count)
    .map((e: any) => e.cartridgeId)
    .filter(Boolean);
}

/**
 * Parse LLM response into CartridgeSelectionResponse
 *
 * The LLM should respond with structured data.
 * If parsing fails, we'll extract what we can.
 */
function parseCartridgeSelection(
  response: any
): CartridgeSelectionResponse {
  try {
    // Expect response.screen.body to contain cartridge ID
    // This is a simplified parser - actual implementation depends on LLM response format

    const body = response.screen?.body || '';

    // Try to extract cartridge ID (first word in uppercase)
    const match = body.match(/\b([A-Z_]+)\b/);
    const selectedId = match ? match[1].toLowerCase() : '';

    return {
      selectedId,
      reasoning: body,
      confidence: 0.8,
    };
  } catch (error) {
    console.error('Failed to parse cartridge selection:', error);
    throw new Error('Invalid LLM response for cartridge selection');
  }
}

/**
 * Singleton instance
 */
export const cartridgeRegistry = createCartridgeRegistry();

/**
 * Helper to register all cartridges at once
 *
 * Call this once on app initialization to make all cartridges available.
 *
 * Usage:
 * ```typescript
 * import { registerAllCartridges } from '@/lib/cartridgeRegistry';
 *
 * registerAllCartridges();
 * ```
 */
export function registerAllCartridges() {
  // Register all available cartridges
  cartridgeRegistry.register(triviaCartridge);
  cartridgeRegistry.register(wouldYouRatherCartridge);

  console.log('📦 Cartridge registration complete');
  console.log(`   Total cartridges: ${cartridgeRegistry.cartridges.size}`);
}
