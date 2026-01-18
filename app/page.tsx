/**
 * ============================================================================
 * HOME PAGE - Game Entry Point
 * ============================================================================
 *
 * This is the main entry point for the game. It handles:
 * - Detecting existing sessions (resume functionality)
 * - Rendering the game orchestrator
 * - Managing global game state
 *
 * The page is intentionally minimal - most logic lives in GameOrchestrator
 */

'use client';

import { useEffect, useState } from 'react';
import { GameOrchestrator } from '@/components/GameOrchestrator';
import { loadLastSession, isLocalStorageAvailable } from '@/lib/persistence';
import { PersistedSession } from '@/types/game';

/**
 * Home page component
 *
 * Responsibilities:
 * - Check for existing session on mount
 * - Render game orchestrator or welcome screen
 * - Handle localStorage availability
 */
export default function HomePage() {
  // State for tracking loading and resume capability
  const [isLoading, setIsLoading] = useState(true);
  const [existingSession, setExistingSession] = useState<PersistedSession | null>(null);
  const [storageAvailable, setStorageAvailable] = useState(true);

  /**
   * On component mount, check for existing session
   */
  useEffect(() => {
    // Check if localStorage is available
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage is not available - game will not persist');
      setStorageAvailable(false);
      setIsLoading(false);
      return;
    }

    // Try to load last session
    try {
      const session = loadLastSession();

      if (session) {
        console.log('Found existing session:', session.setup.sessionId);
        setExistingSession(session);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      // Continue without session - user can start new game
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Show loading state while checking for session
   */
  if (isLoading) {
    return (
      <div className="viewport-container flex-center bg-gradient-to-br from-primary-500 to-secondary-500">
        <div className="text-center">
          <div className="spinner mb-4" />
          <p className="text-white text-lg font-semibold">Loading Family Glitch...</p>
        </div>
      </div>
    );
  }

  /**
   * Show warning if localStorage is not available
   */
  if (!storageAvailable) {
    return (
      <div className="viewport-container flex-center bg-gradient-to-br from-danger-500 to-warning-500 p-6">
        <div className="card max-w-md text-center">
          <h1 className="text-2xl font-bold text-danger-600 mb-4">Storage Not Available</h1>
          <p className="text-neutral-700 mb-4">
            Family Glitch requires browser storage to save your game progress.
            This might be disabled in private browsing mode.
          </p>
          <p className="text-sm text-neutral-500">
            Try opening this app in a regular browser window.
          </p>
        </div>
      </div>
    );
  }

  /**
   * Render the main game orchestrator
   *
   * Pass existing session if found, otherwise start fresh
   */
  return (
    <GameOrchestrator
      existingSession={existingSession}
      onNewGame={() => setExistingSession(null)}
    />
  );
}
