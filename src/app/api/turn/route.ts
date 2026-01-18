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

    console.log('[AI] 🤖 Sending request to OpenAI:', {
      model: 'gpt-4o',
      turn: game_state.meta.turn_count,
      act: game_state.meta.arc.current_act,
      phase: game_state.meta.phase,
      player: game_state.players[game_state.meta.current_player_index]?.name,
      user_input: user_input,
      input_type: input_type,
      system_prompt_length: systemPrompt.length,
      turn_prompt_length: turnPrompt.length,
    });

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

    console.log('[AI] ✅ Received response from OpenAI:', {
      response_length: content.length,
      usage: response.usage,
    });

    let aiResponse;
    try {
      aiResponse = JSON.parse(content);
      console.log('[AI] 📦 Parsed AI Response:', {
        display_title: aiResponse.display?.title,
        display_message: aiResponse.display?.message?.substring(0, 100) + '...',
        interface_type: aiResponse.interface?.type,
        has_updates: !!aiResponse.updates,
        phase_update: aiResponse.updates?.phase,
        turn_count_update: aiResponse.updates?.turn_count,
        new_storage_items: aiResponse.updates?.storage?.length || 0,
        score_event: aiResponse.score_event ? {
          player_id: aiResponse.score_event.player_id,
          points: aiResponse.score_event.points,
          bonus: aiResponse.score_event.bonus,
          reason: aiResponse.score_event.reason,
        } : null,
        has_finale: !!aiResponse.finale,
      });
      console.log('[AI] 🔍 Full AI Response:', JSON.stringify(aiResponse, null, 2));
    } catch {
      console.error('[AI] ❌ JSON parse error:', content);
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
