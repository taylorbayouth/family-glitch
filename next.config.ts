import type { NextConfig } from 'next';

/**
 * Next.js Configuration for Family Glitch
 *
 * Optimized for:
 * - Mobile-first deployment on Vercel
 * - Fast page loads and minimal bundle size
 * - OpenAI API integration via server-side routes
 */
const nextConfig: NextConfig = {
  // Strict mode helps catch common React mistakes
  reactStrictMode: true,

  // Optimize images for mobile devices
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [375, 414, 768, 1024],
  },

  // Enable experimental features for better mobile performance
  experimental: {
    // Optimize package imports to reduce bundle size
    optimizePackageImports: ['react-icons'],
  },

  // Environment variables available to the client
  // NOTE: Never expose API keys here - keep them server-side only
  env: {
    NEXT_PUBLIC_APP_NAME: 'Family Glitch',
    NEXT_PUBLIC_TARGET_DURATION_MS: '900000', // 15 minutes
  },
};

export default nextConfig;
