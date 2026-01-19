/**
 * Mini-Games System
 *
 * Central registry and exports for all mini-games.
 * Mini-games are interactive challenge sequences with their own AI personalities.
 *
 * ARCHITECTURE:
 * - Each mini-game is a self-contained module in its own folder
 * - The apparatus (play page) handles common logic: phase transitions, scoring, handoffs
 * - Mini-games provide: prompt builders, UI components, and config
 */

export * from './types';
export * from './eligibility';
export * from './trivia-challenge';
export * from './personality-match';
