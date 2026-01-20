import type { Metadata, Viewport } from 'next';
import { SessionProvider } from '@/components/SessionProvider';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import './globals.css';

export const metadata: Metadata = {
  title: 'Family Glitch | AI-Powered Party Game',
  description: 'A 15-minute asymmetric party game run by a snarky AI host. Cards Against Humanity meets Black Mirror.',
  keywords: ['party game', 'AI game', 'family game', 'dinner table game', 'mobile game'],
  authors: [{ name: 'Family Glitch' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Family Glitch',
  },
  openGraph: {
    title: 'Family Glitch',
    description: 'A snarky AI host analyzes your dinner table dynamics in real-time.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0A0A0F',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen bg-void text-frost overflow-x-hidden">
        {/* Noise overlay for texture */}
        <div className="noise-overlay" />
        <SessionProvider>
          <HamburgerMenu />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
