'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

/**
 * Session Provider Component
 *
 * Wraps the app with NextAuth's SessionProvider to provide authentication
 * state throughout the component tree. This enables the useSession() hook
 * to work in any client component.
 *
 * Must be a client component since NextAuth's provider uses React context.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
