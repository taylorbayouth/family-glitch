/**
 * Mini-Game Utility Functions
 *
 * Shared utilities used across multiple mini-games to reduce code duplication
 * and ensure consistent behavior.
 */

import type { MiniGamePlayer } from './registry';

/**
 * Extract and parse JSON from AI response text
 *
 * Many AI responses contain JSON surrounded by markdown or explanatory text.
 * This function finds the JSON block and parses it safely.
 *
 * @param text - Raw text from AI response
 * @returns Parsed JSON object or null if parsing fails
 *
 * @example
 * ```typescript
 * const response = "Here's the puzzle: {\"rule\": \"test\"} Hope you like it!";
 * const data = extractAndParseJSON<{rule: string}>(response);
 * // data = { rule: "test" }
 * ```
 */
export function extractAndParseJSON<T>(text: string): T | null {
  try {
    // Match the first JSON object in the text (handles markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return null;
  }
}

/**
 * Get Tailwind color class for a score value
 *
 * Provides consistent color coding across all mini-games:
 * - Green/high color: 4-5 points (excellent)
 * - Yellow/medium color: 2-3 points (good effort)
 * - Red/low color: 0-1 points (needs work)
 *
 * @param score - The score value (0-5)
 * @param maxScore - Maximum possible score (usually 5)
 * @param colorScheme - Optional: which color to use for high scores ('mint'|'amber'|'cyan'|'violet')
 */
export function getScoreColor(score: number, maxScore: number = 5, colorScheme: string = 'mint'): string {
  const percentage = (score / maxScore) * 100;

  if (percentage >= 80) {
    // High score (80%+): Use game's accent color or default mint
    return colorScheme === 'mint' ? 'text-mint'
      : colorScheme === 'amber' ? 'text-amber-400'
      : colorScheme === 'cyan' ? 'text-cyan-400'
      : colorScheme === 'violet' ? 'text-violet-400'
      : 'text-mint';
  }

  if (percentage >= 40) {
    // Medium score (40-79%): Use secondary color
    return colorScheme === 'mint' ? 'text-glitch'
      : colorScheme === 'amber' ? 'text-amber-500'
      : colorScheme === 'cyan' ? 'text-cyan-500'
      : colorScheme === 'violet' ? 'text-violet-500'
      : 'text-glitch';
  }

  // Low score (<40%): Always use alert red
  return 'text-alert';
}

/**
 * Get Tailwind background and border classes for a score card
 *
 * @param score - The score value (0-5)
 * @param maxScore - Maximum possible score (usually 5)
 * @param colorScheme - Optional: which color to use for high scores
 */
export function getScoreBg(score: number, maxScore: number = 5, colorScheme: string = 'mint'): string {
  const percentage = (score / maxScore) * 100;

  if (percentage >= 80) {
    return colorScheme === 'mint' ? 'bg-mint/20 border-mint/50'
      : colorScheme === 'amber' ? 'bg-amber-400/20 border-amber-400/50'
      : colorScheme === 'cyan' ? 'bg-cyan-400/20 border-cyan-400/50'
      : colorScheme === 'violet' ? 'bg-violet-400/20 border-violet-400/50'
      : 'bg-mint/20 border-mint/50';
  }

  if (percentage >= 40) {
    return colorScheme === 'mint' ? 'bg-glitch/20 border-glitch/50'
      : colorScheme === 'amber' ? 'bg-amber-500/20 border-amber-500/50'
      : colorScheme === 'cyan' ? 'bg-cyan-500/20 border-cyan-500/50'
      : colorScheme === 'violet' ? 'bg-violet-500/20 border-violet-500/50'
      : 'bg-glitch/20 border-glitch/50';
  }

  return 'bg-alert/20 border-alert/50';
}

/**
 * Safely get a player's name with fallback
 *
 * Defensive programming to handle undefined/null players gracefully.
 *
 * @param player - Player object (might be undefined)
 * @param fallback - Fallback name if player is missing
 * @returns Player's name or fallback
 */
export function safePlayerName(player: MiniGamePlayer | undefined, fallback: string = 'Player'): string {
  return player?.name || fallback;
}

/**
 * Safely return an array with fallback to empty array
 *
 * Prevents "undefined is not iterable" errors when mapping over arrays.
 *
 * @param arr - Array that might be undefined/null
 * @returns The array or an empty array
 */
export function safeArray<T>(arr: T[] | undefined | null): T[] {
  return arr || [];
}

/**
 * Clamp a number between min and max values
 *
 * Used to ensure scores stay within valid ranges (e.g., 0-5).
 *
 * @param value - The value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Clamped value
 *
 * @example
 * ```typescript
 * clamp(7, 0, 5) // returns 5
 * clamp(-2, 0, 5) // returns 0
 * clamp(3, 0, 5) // returns 3
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Format a list of items with commas and "and" before the last item
 *
 * @param items - Array of strings to format
 * @returns Formatted string (e.g., "A, B, and C")
 *
 * @example
 * ```typescript
 * formatList(['Alice']) // "Alice"
 * formatList(['Alice', 'Bob']) // "Alice and Bob"
 * formatList(['Alice', 'Bob', 'Charlie']) // "Alice, Bob, and Charlie"
 * ```
 */
export function formatList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;

  const allButLast = items.slice(0, -1).join(', ');
  const last = items[items.length - 1];
  return `${allButLast}, and ${last}`;
}
