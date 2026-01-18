import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildSystemPrompt, buildTurnPrompt } from '@/lib/prompts';
import type { AIRequest } from '@/types/game';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const body = (await request.json()) as AIRequest;
    const { game_state, user_input, input_type } = body;

    const systemPrompt = buildSystemPrompt(game_state);
    const turnPrompt = buildTurnPrompt(game_state, user_input, input_type);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: turnPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7, // Slightly lower for sharper, more consistent responses
      max_tokens: 2000,
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
            title: 'Parse Error',
            message: 'The Glitch garbled its response. Try again.',
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
          title: 'Connection Error',
          message: 'The Glitch encountered interference. Try again.',
        },
      },
      { status: 500 }
    );
  }
}
