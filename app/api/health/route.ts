/**
 * Health Check Endpoint
 *
 * Diagnostic endpoint that returns server status and environment info
 * without making any OpenAI API calls. Useful for debugging deployment issues.
 *
 * Returns:
 * - status: 'ok'
 * - timestamp: Current server time
 * - environment: Node version, API key status, etc.
 *
 * Note: Only exposes non-sensitive diagnostic info (API key prefix, not full key)
 */
import { NextResponse } from 'next/server';

export async function GET() {
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  const apiKeyPrefix = process.env.OPENAI_API_KEY?.substring(0, 7) || 'not set';

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      hasApiKey,
      apiKeyPrefix,
    },
  });
}
