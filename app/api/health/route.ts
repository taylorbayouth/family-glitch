import { NextResponse } from 'next/server';

/**
 * Health check endpoint - doesn't require OpenAI
 */
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
