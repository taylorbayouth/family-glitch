/**
 * LoadingSpinner Component
 *
 * Displays an animated loading indicator with a message.
 * Used across all mini-games during AI generation/scoring phases.
 *
 * Accessibility: Includes proper ARIA labels for screen readers.
 */

'use client';

interface LoadingSpinnerProps {
  /** Tailwind color class (e.g., 'glitch', 'amber-400', 'cyan-500') */
  color: string;

  /** Message to display below the spinner */
  message: string;
}

/**
 * Animated 3-dot loading spinner
 *
 * Shows three pulsing dots with staggered animation for a smooth loading effect.
 * Announces loading state to screen readers via ARIA.
 */
export function LoadingSpinner({ color, message }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={`Loading: ${message}`}
      className="text-center space-y-4"
    >
      {/* Three pulsing dots */}
      <div className="flex justify-center space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full bg-${color} animate-pulse`}
            style={{ animationDelay: `${i * 200}ms` }}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Loading message */}
      <p className="text-frost font-mono text-sm md:text-base">
        {message}
      </p>
    </div>
  );
}
