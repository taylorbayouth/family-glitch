/**
 * ErrorToast Component
 *
 * Displays error messages at the bottom of the screen with an optional retry button.
 * Used across all mini-games for consistent error handling UX.
 *
 * Fixed positioning with high z-index ensures it appears above all content.
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface ErrorToastProps {
  /** Error message to display (null/undefined hides the toast) */
  error: string | null | undefined;

  /** Optional callback for retry button */
  onRetry?: () => void;

  /** Optional callback to dismiss the error */
  onDismiss?: () => void;
}

/**
 * Fixed error toast notification
 *
 * Appears at the bottom of the screen when an error occurs.
 * Includes an optional retry button and close button.
 *
 * Uses z-[60] to appear above mini-game intro screens (z-50).
 */
export function ErrorToast({ error, onRetry, onDismiss }: ErrorToastProps) {
  if (!error) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 left-6 right-6 z-[60] glass rounded-xl p-4 border-2 border-alert max-w-2xl mx-auto"
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-start gap-3">
          {/* Error icon */}
          <span className="text-2xl flex-shrink-0" aria-hidden="true">
            ⚠️
          </span>

          {/* Error message */}
          <div className="flex-1">
            <p className="text-alert font-medium mb-2">Error</p>
            <p className="text-frost text-sm">{error}</p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-shrink-0">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-3 py-1 rounded-lg bg-alert/20 hover:bg-alert/30 text-alert text-sm font-medium transition-colors"
                aria-label="Retry"
              >
                Retry
              </button>
            )}

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-3 py-1 rounded-lg bg-steel-800 hover:bg-steel-700 text-frost text-sm font-medium transition-colors"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
