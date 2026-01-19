/**
 * NextAuth Configuration
 *
 * Configures authentication for the Family Glitch app using NextAuth.js v5.
 * Uses Google OAuth as the only authentication provider.
 *
 * Environment variables required:
 * - AUTH_GOOGLE_ID: Google OAuth client ID
 * - AUTH_GOOGLE_SECRET: Google OAuth client secret
 * - AUTH_SECRET: Secret for signing JWTs (generate with: openssl rand -base64 32)
 */
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    // Custom sign-in page (instead of NextAuth's default)
    signIn: '/auth/signin',
  },
  callbacks: {
    // Authorization callback - determines if user can access protected routes
    authorized: async ({ auth }) => {
      // Allow all authenticated users
      return !!auth;
    },
  },
});
