/**
 * ============================================================================
 * ROOT LAYOUT - App Shell
 * ============================================================================
 *
 * This is the root layout for the entire app. It wraps all pages and
 * provides the basic HTML structure, fonts, and global providers.
 *
 * Key features:
 * - Mobile-first viewport configuration
 * - PWA-ready meta tags
 * - System font stack for performance
 * - Global CSS imports
 */

import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

/**
 * Viewport configuration - critical for mobile layout
 *
 * - width=device-width: Use device's actual width
 * - initial-scale=1: Don't zoom on load
 * - maximum-scale=1: Prevent pinch-zoom (controversial, but helps with accidental zooms during gameplay)
 * - user-scalable=no: Disable zoom (again, for consistent gameplay UX)
 * - viewport-fit=cover: Support notched devices (iPhone X+)
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#3b82f6', // Primary blue color
};

/**
 * Metadata configuration - SEO and PWA
 */
export const metadata: Metadata = {
  title: 'Family Glitch',
  description:
    'A mobile-first pass-and-play family game powered by AI. Perfect for restaurants, road trips, or family game night.',
  keywords: [
    'family game',
    'party game',
    'mobile game',
    'pass and play',
    'AI game',
    'restaurant game',
  ],
  authors: [{ name: 'Family Glitch Team' }],
  creator: 'Family Glitch',
  publisher: 'Family Glitch',
  robots: 'index, follow',

  // Open Graph (social media sharing)
  openGraph: {
    type: 'website',
    title: 'Family Glitch',
    description: 'A mobile-first pass-and-play family game powered by AI',
    siteName: 'Family Glitch',
  },

  // PWA manifest
  manifest: '/manifest.json',

  // Apple-specific
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Family Glitch',
  },
};

/**
 * Root Layout Component
 *
 * This wraps all pages in the app. Keep it minimal - heavy logic
 * should go in page components or providers.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <head>
        {/* Preconnect to OpenAI API for faster requests */}
        <link rel="preconnect" href="https://api.openai.com" />

        {/* Favicon (using default Next.js icon for now) */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="antialiased font-sans">
        {/* Main app content */}
        <div id="app-root" className="h-screen-dynamic w-full overflow-hidden">
          {children}
        </div>

        {/* Portal root for modals, toasts, etc. */}
        <div id="portal-root" />
      </body>
    </html>
  );
}
