/**
 * ============================================================================
 * PERSISTENCE LAYER - localStorage Management
 * ============================================================================
 *
 * This module handles saving and loading game sessions to/from browser
 * localStorage. This allows players to:
 * - Resume games after accidental browser refresh
 * - Take a break and come back later
 * - Export session data for debugging
 *
 * Key design decisions:
 * - Use localStorage (not IndexedDB) for simplicity
 * - Store entire session as single JSON object
 * - Synchronous API (acceptable for our data size ~50-100KB)
 * - Version string for future schema migrations
 *
 * Storage keys:
 * - `family-glitch-session-{sessionId}` - Full session data
 * - `family-glitch-last-session` - Most recent session ID (for quick resume)
 */

import { PersistedSession, GameSetup, GameState, EventLog, FactsDB } from '@/types/game';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Current schema version - increment when making breaking changes */
const SCHEMA_VERSION = '1.0.0';

/** localStorage key prefix */
const STORAGE_PREFIX = 'family-glitch';

/** Key for tracking most recent session */
const LAST_SESSION_KEY = `${STORAGE_PREFIX}-last-session`;

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Custom error for persistence operations
 */
export class PersistenceError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'PersistenceError';
  }
}

/**
 * Check if localStorage is available and working
 * Some browsers disable it in private mode
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = `${STORAGE_PREFIX}-test`;
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.warn('localStorage is not available:', e);
    return false;
  }
}

// ============================================================================
// SAVE OPERATIONS
// ============================================================================

/**
 * Save a complete game session to localStorage
 *
 * @param session - Complete session data
 * @throws PersistenceError if save fails
 */
export function saveSession(session: PersistedSession): void {
  if (!isLocalStorageAvailable()) {
    throw new PersistenceError('localStorage is not available');
  }

  try {
    // Update last saved timestamp
    const sessionToSave: PersistedSession = {
      ...session,
      lastSaved: Date.now(),
    };

    // Serialize to JSON
    const json = JSON.stringify(sessionToSave);

    // Calculate size for logging
    const sizeKB = (new Blob([json]).size / 1024).toFixed(2);
    console.log(`Saving session ${session.setup.sessionId} (${sizeKB} KB)`);

    // Save to localStorage
    const key = `${STORAGE_PREFIX}-session-${session.setup.sessionId}`;
    localStorage.setItem(key, json);

    // Update "last session" pointer
    localStorage.setItem(LAST_SESSION_KEY, session.setup.sessionId);
  } catch (e) {
    // Most common error: QuotaExceededError (storage full)
    if (e instanceof Error && e.name === 'QuotaExceededError') {
      throw new PersistenceError(
        'Storage quota exceeded. Try clearing old sessions.',
        e
      );
    }

    throw new PersistenceError('Failed to save session', e);
  }
}

/**
 * Auto-save wrapper - silently fails on error
 * Use this for background auto-saves where you don't want to disrupt gameplay
 *
 * @param session - Session to save
 * @returns true if save succeeded, false otherwise
 */
export function autoSaveSession(session: PersistedSession): boolean {
  try {
    saveSession(session);
    return true;
  } catch (e) {
    console.error('Auto-save failed:', e);
    return false;
  }
}

/**
 * Clear all saved game data
 *
 * Use this for "Start Over" functionality or testing.
 * Clears the entire game from localStorage.
 */
export function clearAllGameData(): void {
  if (typeof window === 'undefined') return;

  try {
    // Clear all keys that start with our prefix
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`✅ Game data cleared (${keysToRemove.length} items)`);
  } catch (error) {
    console.error('Failed to clear game data:', error);
    throw new PersistenceError('Could not clear game data', error);
  }
}

// ============================================================================
// LOAD OPERATIONS
// ============================================================================

/**
 * Load a specific session by ID
 *
 * @param sessionId - Session identifier
 * @returns Loaded session or null if not found
 * @throws PersistenceError if parsing fails
 */
export function loadSession(sessionId: string): PersistedSession | null {
  if (!isLocalStorageAvailable()) {
    throw new PersistenceError('localStorage is not available');
  }

  try {
    const key = `${STORAGE_PREFIX}-session-${sessionId}`;
    const json = localStorage.getItem(key);

    if (!json) {
      return null;
    }

    // Parse JSON
    const session = JSON.parse(json) as PersistedSession;

    // Validate schema version
    if (session.version !== SCHEMA_VERSION) {
      console.warn(
        `Session schema mismatch: saved=${session.version}, current=${SCHEMA_VERSION}`
      );
      // TODO: Implement migration logic when we bump versions
      // For now, just log a warning but still load it
    }

    console.log(`Loaded session ${sessionId} from ${new Date(session.lastSaved).toLocaleString()}`);

    return session;
  } catch (e) {
    throw new PersistenceError('Failed to parse session data', e);
  }
}

/**
 * Load the most recent session (quick resume)
 *
 * @returns Most recent session or null if none exists
 */
export function loadLastSession(): PersistedSession | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  const lastSessionId = localStorage.getItem(LAST_SESSION_KEY);

  if (!lastSessionId) {
    return null;
  }

  return loadSession(lastSessionId);
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete a specific session
 *
 * @param sessionId - Session to delete
 */
export function deleteSession(sessionId: string): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  const key = `${STORAGE_PREFIX}-session-${sessionId}`;
  localStorage.removeItem(key);

  // If this was the last session, clear that pointer
  const lastSessionId = localStorage.getItem(LAST_SESSION_KEY);
  if (lastSessionId === sessionId) {
    localStorage.removeItem(LAST_SESSION_KEY);
  }

  console.log(`Deleted session ${sessionId}`);
}

/**
 * Delete all Family Glitch sessions
 * Useful for clearing storage or starting fresh
 */
export function deleteAllSessions(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  // Find all keys with our prefix
  const keysToDelete: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      keysToDelete.push(key);
    }
  }

  // Delete them
  keysToDelete.forEach((key) => localStorage.removeItem(key));

  console.log(`Deleted ${keysToDelete.length} sessions`);
}

// ============================================================================
// QUERY OPERATIONS
// ============================================================================

/**
 * List all saved sessions
 * Returns metadata only (not full session data)
 *
 * @returns Array of session metadata
 */
export function listSessions(): Array<{
  sessionId: string;
  createdAt: number;
  lastSaved: number;
  playerCount: number;
  currentState: string;
}> {
  if (!isLocalStorageAvailable()) {
    return [];
  }

  const sessions: Array<{
    sessionId: string;
    createdAt: number;
    lastSaved: number;
    playerCount: number;
    currentState: string;
  }> = [];

  // Scan localStorage for session keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (key && key.startsWith(`${STORAGE_PREFIX}-session-`)) {
      try {
        const json = localStorage.getItem(key);
        if (json) {
          const session = JSON.parse(json) as PersistedSession;

          sessions.push({
            sessionId: session.setup.sessionId,
            createdAt: session.setup.createdAt,
            lastSaved: session.lastSaved,
            playerCount: session.setup.players.length,
            currentState: session.state.currentState,
          });
        }
      } catch (e) {
        console.error(`Failed to parse session from key ${key}:`, e);
      }
    }
  }

  // Sort by last saved (most recent first)
  sessions.sort((a, b) => b.lastSaved - a.lastSaved);

  return sessions;
}

/**
 * Get storage usage statistics
 */
export function getStorageStats(): {
  totalSessions: number;
  totalSizeKB: number;
  oldestSession: number | null;
  newestSession: number | null;
} {
  if (!isLocalStorageAvailable()) {
    return {
      totalSessions: 0,
      totalSizeKB: 0,
      oldestSession: null,
      newestSession: null,
    };
  }

  let totalSize = 0;
  let totalSessions = 0;
  let oldest: number | null = null;
  let newest: number | null = null;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (key && key.startsWith(`${STORAGE_PREFIX}-session-`)) {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += new Blob([item]).size;
        totalSessions++;

        try {
          const session = JSON.parse(item) as PersistedSession;
          const timestamp = session.setup.createdAt;

          if (oldest === null || timestamp < oldest) {
            oldest = timestamp;
          }
          if (newest === null || timestamp > newest) {
            newest = timestamp;
          }
        } catch (e) {
          // Skip invalid sessions
        }
      }
    }
  }

  return {
    totalSessions,
    totalSizeKB: Number((totalSize / 1024).toFixed(2)),
    oldestSession: oldest,
    newestSession: newest,
  };
}

// ============================================================================
// EXPORT / IMPORT
// ============================================================================

/**
 * Export a session as a downloadable JSON file
 * Useful for debugging and sharing test cases
 *
 * @param sessionId - Session to export
 * @returns JSON string or null if session not found
 */
export function exportSessionAsJSON(sessionId: string): string | null {
  const session = loadSession(sessionId);

  if (!session) {
    return null;
  }

  // Pretty-print for readability
  return JSON.stringify(session, null, 2);
}

/**
 * Trigger a browser download of a session JSON file
 *
 * @param sessionId - Session to download
 */
export function downloadSession(sessionId: string): void {
  const json = exportSessionAsJSON(sessionId);

  if (!json) {
    console.error(`Session ${sessionId} not found`);
    return;
  }

  // Create a blob and download link
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `family-glitch-${sessionId}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);

  console.log(`Downloaded session ${sessionId}`);
}

/**
 * Import a session from JSON string
 * Validates structure before saving
 *
 * @param json - JSON string to import
 * @returns Session ID if successful, null if invalid
 */
export function importSessionFromJSON(json: string): string | null {
  try {
    const session = JSON.parse(json) as PersistedSession;

    // Basic validation
    if (
      !session.setup ||
      !session.state ||
      !session.eventLog ||
      !session.factsDB
    ) {
      console.error('Invalid session structure');
      return null;
    }

    // Save it
    saveSession(session);

    return session.setup.sessionId;
  } catch (e) {
    console.error('Failed to import session:', e);
    return null;
  }
}

// ============================================================================
// HELPER FUNCTIONS FOR BUILDING PERSISTED SESSIONS
// ============================================================================

/**
 * Create a new persisted session from components
 *
 * Helper function to assemble a complete PersistedSession object
 * from individual pieces. Used when starting a new game.
 */
export function createPersistedSession(
  setup: GameSetup,
  state: GameState,
  eventLog: EventLog,
  factsDB: FactsDB,
  scores: Record<string, number>
): PersistedSession {
  return {
    setup,
    state,
    eventLog,
    factsDB,
    scores,
    version: SCHEMA_VERSION,
    lastSaved: Date.now(),
  };
}

/**
 * Check if a session is stale (not updated recently)
 *
 * @param session - Session to check
 * @param maxAgeMs - Maximum age in milliseconds (default: 24 hours)
 * @returns true if session is older than maxAgeMs
 */
export function isSessionStale(
  session: PersistedSession,
  maxAgeMs: number = 24 * 60 * 60 * 1000
): boolean {
  const age = Date.now() - session.lastSaved;
  return age > maxAgeMs;
}
