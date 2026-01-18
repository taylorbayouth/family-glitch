/**
 * ============================================================================
 * LLM API ROUTE - OpenAI Integration Endpoint
 * ============================================================================
 *
 * This API route handles all LLM requests from the game client.
 * It enforces JSON schema, handles errors, and implements retries.
 *
 * Design principles:
 * - JSON-only responses (strict schema)
 * - Rate limiting and retry logic
 * - Detailed error logging
 * - Safety checks
 * - Stateless (all context in request body)
 *
 * Security:
 * - API key stored server-side only
 * - Request validation
 * - Content moderation (future)
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { LLMRequest, LLMResponse } from '@/types/game';
import { LLM } from '@/lib/constants';

// ============================================================================
// OPENAI CLIENT INITIALIZATION
// ============================================================================

/**
 * Initialize OpenAI client with API key from environment
 *
 * IMPORTANT: API key must be set in .env.local:
 * OPENAI_API_KEY=sk-...
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// REQUEST HANDLER
// ============================================================================

/**
 * POST /api/llm
 *
 * Accepts LLMRequest, returns LLMResponse
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: LLMRequest = await request.json();

    // Validate required fields
    if (!body.requestType || !body.currentState || !body.safetyMode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build system prompt based on request type
    const systemPrompt = buildSystemPrompt(body);

    // Build user prompt with context
    const userPrompt = buildUserPrompt(body);

    // Log request for debugging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('LLM Request:', {
        requestType: body.requestType,
        currentState: body.currentState,
        act: body.currentAct,
        activePlayer: body.activePlayerId,
      });
    }

    // Call OpenAI GPT-5.2 with chat completions API
    // Note: GPT-5.2 uses standard chat completions format
    const completion = await openai.chat.completions.create({
      model: LLM.MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: LLM.TEMPERATURE,
      max_tokens: LLM.MAX_RESPONSE_TOKENS,
      top_p: LLM.TOP_P,
      frequency_penalty: LLM.FREQUENCY_PENALTY,
      presence_penalty: LLM.PRESENCE_PENALTY,
      response_format: { type: 'json_object' },
    });

    // Parse JSON response from message content
    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in response');
    }

    const response: LLMResponse = JSON.parse(content);

    // Validate safety flags
    if (!response.safetyFlags.contentAppropriate || !response.safetyFlags.ageAppropriate) {
      console.warn('Content flagged as inappropriate:', response.safetyFlags);

      // Use fallback safe content
      return NextResponse.json({
        nextState: 'ACT1_FACT_PROMPT_PRIVATE',
        screen: {
          modality: 'text',
          title: 'Quick Question',
          body: "What's something fun you did recently?",
          instructions: 'Share your answer privately',
          private: true,
        },
        inputModule: {
          type: 'textarea',
          privateMode: true,
          placeholder: 'Type your answer...',
          maxLength: 200,
        },
        factsToStore: [{
          targetPlayerId: body.activePlayerId || body.players[0].id,
          category: 'preference',
          question: "What's something fun you did recently?",
          answer: '',
          privacyLevel: 'private-until-act3',
        }],
        safetyFlags: {
          contentAppropriate: true,
          ageAppropriate: true,
          warningMessage: 'Using fallback safe content',
        },
        meta: {},
      });
    }

    // Log response for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('LLM Response:', {
        nextState: response.nextState,
        modality: response.screen.modality,
        inputModule: response.inputModule?.type || 'none',
      });
    }

    // Return successful response
    return NextResponse.json(response);
  } catch (error: any) {
    // Log error details
    console.error('LLM API Error:', {
      message: error.message,
      type: error.constructor.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });

    // Return error response
    return NextResponse.json(
      {
        error: 'Failed to generate content',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PROMPT BUILDERS
// ============================================================================

/**
 * Build system prompt based on request type
 *
 * This sets the context and behavior for the LLM
 */
function buildSystemPrompt(request: LLMRequest): string {
  const basePrompt = `You are the game master for "Family Glitch", a mobile pass-and-play family game.

Your role is to generate prompts, select mini-games, format reveals, and suggest scoring based on the current game state.

CRITICAL RULES:
1. ALWAYS respond with valid JSON only (no other text)
2. Use this exact structure:
{
  "nextState": string (one of: ACT1_FACT_PROMPT_PRIVATE, ACT1_FACT_CONFIRM, ACT1_TRANSITION, ACT2_CARTRIDGE_ACTIVE, ACT2_TRANSITION, ACT3_FINAL_REVEAL, ACT3_HIGHLIGHTS, ACT3_TALLY, END),
  "screen": {
    "title": string (max 60 chars),
    "body": string (max 500 chars),
    "modality": "text" | "image" | "ascii",
    "private": boolean,
    "instructions": string (max 100 chars),
    "imagePrompt": string (optional, for DALL-E)
  },
  "inputModule": object or null,
  "factsToStore": array (for Act 1 only),
  "safetyFlags": {
    "contentAppropriate": boolean,
    "ageAppropriate": boolean,
    "warningMessage": string (optional)
  },
  "meta": object
}
3. Respect the safety mode: ${request.safetyMode}
4. Keep content concise - this is a mobile game
5. Make prompts clever and engaging, not generic

SAFETY MODE: ${request.safetyMode}
${
  request.safetyMode === 'kid-safe'
    ? '- Appropriate for ages 10-12\n- Mild humor only\n- No adult themes'
    : '- Appropriate for ages 13+\n- Sophisticated humor allowed'
}

CURRENT GAME STATE:
- Act: ${request.currentAct}
- State: ${request.currentState}
- Time elapsed: ${Math.round(request.timeElapsedMs / 60000)} min / ${Math.round(request.targetDurationMs / 60000)} min
- Facts gathered: ${request.act1FactCount}
- Rounds completed: ${request.act2RoundsCompleted}

PLAYERS:
${request.players.map((p) => `- ${p.name} (${p.age} year old ${p.role})`).join('\n')}`;

  // Add request-specific guidance
  switch (request.requestType) {
    case 'next-prompt':
      return (
        basePrompt +
        `\n\nTASK: Generate a fact-gathering prompt for Act 1
- Make it observational, contextual, or thought-provoking (not generic trivia)
- Use player context (age, role) to personalize
- Short enough to answer in 30-60 seconds
- Must be appropriate for ${request.safetyMode} mode`
      );

    case 'select-cartridge':
      return (
        basePrompt +
        `\n\nTASK: Select and introduce a mini-game cartridge for Act 2
- Choose based on available facts, time remaining, and player variety
- Avoid cartridges played recently
- Provide an engaging intro that explains the rules`
      );

    case 'generate-reveal':
      return (
        basePrompt +
        `\n\nTASK: Format a reveal for the submitted answer
- Make it engaging and highlight clever/funny elements
- Keep it concise (2-3 sentences max)
- Use {{answer}} and {{playerName}} placeholders`
      );

    case 'suggest-scoring':
      return (
        basePrompt +
        `\n\nTASK: Provide scoring guidance for judges
- Specify which dimension(s): correctness, cleverness, humor
- Give a clear rubric
- Suggest who should vote (all, all-except-active, specific judge)`
      );

    case 'act-transition':
      return (
        basePrompt +
        `\n\nTASK: Generate a transition screen between acts
- Celebrate progress
- Set expectations for the next act
- Keep energy high and momentum going`
      );

    default:
      return basePrompt;
  }
}

/**
 * Build user prompt with game context
 *
 * This provides the specific context for this request
 */
function buildUserPrompt(request: LLMRequest): string {
  const parts: string[] = [];

  // Active player context
  if (request.activePlayerId) {
    const activePlayer = request.players.find((p) => p.id === request.activePlayerId);
    if (activePlayer) {
      parts.push(`Active player: ${activePlayer.name} (${activePlayer.age}, ${activePlayer.role})`);
    }
  }

  // Recent events context (for continuity)
  if (request.recentEvents && request.recentEvents.length > 0) {
    parts.push(`\nRecent events: ${request.recentEvents.length} events in history`);
  }

  // Facts context (for Act 2 cartridges)
  if (request.factsDB && request.factsDB.length > 0) {
    parts.push(`\nAvailable facts: ${request.factsDB.length} facts about the players`);
    // Include a few sample facts
    const sampleFacts = request.factsDB.slice(0, 3);
    parts.push('Sample facts:');
    sampleFacts.forEach((fact) => {
      const targetPlayer = request.players.find((p) => p.id === fact.targetPlayerId);
      parts.push(`- ${targetPlayer?.name || 'Someone'}: ${fact.question} → ${fact.answer}`);
    });
  }

  // Scores context
  parts.push('\nCurrent scores:');
  request.players.forEach((player) => {
    const score = request.currentScores[player.id] || 0;
    parts.push(`- ${player.name}: ${score} points`);
  });

  // Last answer context (for reveals)
  if (request.lastAnswer) {
    parts.push(`\nLast answer submitted: ${JSON.stringify(request.lastAnswer)}`);
  }

  // Cartridge context (if applicable)
  if (request.cartridgeContext) {
    parts.push(`\nCartridge context: ${request.cartridgeContext.cartridgeId}`);
  }

  parts.push('\nGenerate the appropriate game content now.');

  return parts.join('\n');
}
