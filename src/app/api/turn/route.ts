import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildSystemPrompt, buildTurnPrompt } from '@/lib/prompts';
import type { GameState } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const body = await request.json();
    const { gameState, userInput, inputType } = body as {
      gameState: GameState;
      userInput?: string;
      inputType?: string;
    };

    const systemPrompt = buildSystemPrompt(gameState);
    const turnPrompt = buildTurnPrompt(gameState, userInput, inputType);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: turnPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.9,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    let aiResponse;
    try {
      aiResponse = JSON.parse(content);
    } catch {
      console.error('AI JSON parse error:', content);
      return NextResponse.json(
        {
          error: 'Invalid AI response',
          display: {
            title: 'Glitch Error!',
            message: 'The Glitch garbled its reply. Tap to retry.',
          },
        },
        { status: 502 }
      );
    }

    return NextResponse.json(aiResponse);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get AI response',
        display: {
          title: 'Glitch Error!',
          message: 'The Glitch encountered a temporal anomaly. Try again!',
        },
      },
      { status: 500 }
    );
  }
}
