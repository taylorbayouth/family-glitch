/**
 * ============================================================================
 * WELCOME SCREEN - Resume or Start New
 * ============================================================================
 *
 * This screen appears when the app detects an existing saved session.
 * It gives players the choice to:
 * - Resume the existing game
 * - Start a brand new game
 *
 * Design goals:
 * - Make it obvious what resuming means
 * - Show session info (players, progress)
 * - Don't accidentally lose progress
 */

'use client';

import { PersistedSession } from '@/types/game';
import { formatDuration } from '@/lib/pacing';
import { getStateName } from '@/lib/stateMachine';

/**
 * Props for WelcomeScreen
 */
interface WelcomeScreenProps {
  /** Existing session found in storage */
  session: PersistedSession;

  /** Callback to resume the existing session */
  onResume: () => void;

  /** Callback to start a completely new game */
  onNewGame: () => void;
}

/**
 * Welcome Screen Component
 *
 * Shows session info and resume/new game options
 */
export function WelcomeScreen({
  session,
  onResume,
  onNewGame,
}: WelcomeScreenProps) {
  // Calculate session age
  const sessionAge = Date.now() - session.lastSaved;
  const sessionAgeFormatted = formatDuration(sessionAge);

  // Check if session is stale (older than 24 hours)
  const isStale = sessionAge > 24 * 60 * 60 * 1000;

  // Get current act
  const actNumber = session.state.currentAct;

  // Format player list
  const playerNames = session.setup.players.map((p) => p.name).join(', ');

  return (
    <div className="viewport-container bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8 animate-slide-down">
            <h1 className="text-5xl font-bold text-white mb-2 glitch">
              FAMILY GLITCH
            </h1>
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome Back!
            </h2>
            <p className="text-primary-100 text-lg">
              We found an unfinished game
            </p>
          </div>

          {/* Session info card */}
          <div className="card mb-4 animate-slide-up">
            <h2 className="text-xl font-bold mb-4">Previous Session</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Players:</span>
                <span className="font-semibold text-neutral-900">
                  {playerNames}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-600">Progress:</span>
                <span className="font-semibold text-neutral-900">
                  Act {actNumber}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-600">Current State:</span>
                <span className="font-semibold text-neutral-900">
                  {getStateName(session.state.currentState)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-neutral-600">Last Played:</span>
                <span
                  className={`font-semibold ${
                    isStale ? 'text-warning-600' : 'text-neutral-900'
                  }`}
                >
                  {sessionAgeFormatted} ago
                </span>
              </div>

              {/* Facts gathered (if in Act 2+) */}
              {session.factsDB.facts.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">Facts Gathered:</span>
                  <span className="font-semibold text-neutral-900">
                    {session.factsDB.facts.length}
                  </span>
                </div>
              )}
            </div>

            {/* Stale warning */}
            {isStale && (
              <div className="mt-4 p-3 bg-warning-50 border border-warning-300 rounded-lg">
                <p className="text-sm text-warning-700">
                  This session is over 24 hours old. You might want to start fresh!
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-3 animate-slide-up">
            <button onClick={onResume} className="btn-primary w-full text-lg">
              Resume Game
            </button>

            <button onClick={onNewGame} className="btn-outline w-full">
              Start New Game
            </button>
          </div>

          {/* Help text */}
          <p className="text-center text-primary-100 text-sm mt-6">
            {isStale
              ? 'Starting fresh is recommended for stale sessions'
              : 'Your progress is automatically saved'}
          </p>
        </div>
      </div>
    </div>
  );
}
