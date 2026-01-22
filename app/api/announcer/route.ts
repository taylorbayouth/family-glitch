/**
 * Announcer API Route
 *
 * Endpoint for the end-game commentary AI that analyzes player performance
 * and delivers personalized results with flair.
 */
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { validateApiKey } from '@/lib/ai/config';
import { buildAnnouncerPrompt } from '@/lib/ai/announcer-prompt';
import type {
  AnnouncerRequest,
  AnnouncerResponse,
  AnnouncerResult,
} from '@/lib/types/announcer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// OpenAI client singleton
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    validateApiKey();
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

/**
 * POST /api/announcer - Get end-game commentary
 */
export async function POST(req: NextRequest) {
  try {
    const client = getOpenAIClient();

    const body: AnnouncerRequest = await req.json();
    const { gameData } = body;

    if (!gameData || !gameData.players || gameData.players.length === 0) {
      return NextResponse.json<AnnouncerResponse>(
        { success: false, error: 'Game data with players is required' },
        { status: 400 }
      );
    }

    // Build the announcer prompt
    const systemPrompt = buildAnnouncerPrompt(gameData);

    // Call OpenAI for the analysis
    const response = await client.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content:
            'Analyze this game and provide the final results. Respond with valid JSON only.',
        },
      ],
      temperature: 0.8, // Slightly creative for entertaining commentary
      max_completion_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json<AnnouncerResponse>(
        { success: false, error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let result: AnnouncerResult;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse announcer response:', content);
      return NextResponse.json<AnnouncerResponse>(
        { success: false, error: 'Invalid JSON response from AI' },
        { status: 500 }
      );
    }

    // Validate the response has rankings
    if (!result.rankings || !Array.isArray(result.rankings)) {
      return NextResponse.json<AnnouncerResponse>(
        { success: false, error: 'Invalid response structure from AI' },
        { status: 500 }
      );
    }

    return NextResponse.json<AnnouncerResponse>({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Announcer API error:', error);
    return NextResponse.json<AnnouncerResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/announcer - Health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    description: 'Announcer API - End-game commentary generator',
  });
}
