import { useEffect, useState } from 'react';

/**
 * Hook to ensure Zustand store is hydrated before rendering
 * Prevents hydration mismatches in Next.js SSR
 *
 * @example
 * const hasHydrated = useHydration();
 * if (!hasHydrated) return <Loading />;
 */
export function useHydration() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
}
