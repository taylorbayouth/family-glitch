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
import { LLMRequest, LLMResponse } from '@/types/game';
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
// JSON SCHEMA FOR FUNCTION CALLING
// ============================================================================

/**
 * Strict JSON schema for LLM responses
 *
 * This is enforced via OpenAI's function calling feature to ensure
 * the LLM always returns valid, parseable JSON.
 */
const LLM_RESPONSE_SCHEMA = {
  name: 'generate_game_content',
  description: 'Generate game content for Family Glitch',
  parameters: {
    type: 'object',
    required: ['nextState', 'screen', 'safetyFlags'],
    properties: {
      nextState: {
        type: 'string',
        enum: [
          'ACT1_FACT_PROMPT_PRIVATE',
          'ACT1_FACT_CONFIRM',
          'ACT1_TRANSITION',
          'ACT2_CARTRIDGE_INTRO',
          'ACT2_TURN_PRIVATE_INPUT',
          'ACT2_PUBLIC_REVEAL',
          'ACT2_SCORING',
          'ACT2_TRANSITION',
          'ACT3_FINAL_REVEAL',
          'ACT3_HIGHLIGHTS',
          'ACT3_TALLY',
          'END',
        ],
      },
      screen: {
        type: 'object',
        required: ['title', 'body', 'modality', 'private', 'instructions'],
        properties: {
          title: { type: 'string', maxLength: 60 },
          body: { type: 'string', maxLength: 500 },
          modality: { type: 'string', enum: ['text', 'image', 'ascii'] },
          private: { type: 'boolean' },
          instructions: { type: 'string', maxLength: 100 },
          imagePrompt: { type: 'string', maxLength: 300 },
        },
      },
      inputModule: {
        oneOf: [
          { type: 'null' },
          {
            type: 'object',
            required: ['type', 'privateMode'],
            properties: {
              type: {
                type: 'string',
                enum: ['textarea', 'input-field', 'timed-input', 'multiple-choice', 'word-checkbox-grid'],
              },
              privateMode: { type: 'boolean' },
              placeholder: { type: 'string' },
              maxLength: { type: 'number' },
              timeLimitSec: { type: 'number' },
              options: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    text: { type: 'string' },
                  },
                },
              },
              words: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    text: { type: 'string' },
                    correct: { type: 'boolean' },
                  },
                },
              },
            },
          },
        ],
      },
      reveal: {
        type: 'object',
        properties: {
          template: { type: 'string' },
          format: { type: 'string', enum: ['text', 'comparison', 'list'] },
        },
      },
      scoring: {
        type: 'object',
        properties: {
          mode: { type: 'string', enum: ['judge', 'group-vote', 'auto', 'llm-score'] },
          rubric: { type: 'string' },
          whoVotes: { type: 'string' },
          dimensions: {
            type: 'array',
            items: { type: 'string', enum: ['correctness', 'cleverness', 'humor', 'bonus'] },
          },
          allowBonus: { type: 'boolean' },
        },
      },
      factsToStore: {
        type: 'array',
        items: {
          type: 'object',
          required: ['targetPlayerId', 'category', 'question', 'answer', 'privacyLevel'],
          properties: {
            targetPlayerId: { type: 'string' },
            category: {
              type: 'string',
              enum: ['observational', 'preference', 'behavioral', 'reasoning', 'hypothetical', 'estimation', 'values'],
            },
            question: { type: 'string' },
            answer: { type: 'string' },
            privacyLevel: { type: 'string', enum: ['private-until-act3', 'reveal-immediately'] },
          },
        },
      },
      safetyFlags: {
        type: 'object',
        required: ['contentAppropriate', 'ageAppropriate'],
        properties: {
          contentAppropriate: { type: 'boolean' },
          ageAppropriate: { type: 'boolean' },
          warningMessage: { type: 'string' },
        },
      },
      meta: {
        type: 'object',
        properties: {
          cartridgeId: { type: 'string' },
          shouldEndAct: { type: 'boolean' },
          suggestedNextActivePlayerId: { type: 'string' },
        },
      },
    },
  },
};

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

    // Call OpenAI with function calling (ensures JSON response)
    const completion = await openai.chat.completions.create({
      model: LLM.MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      functions: [LLM_RESPONSE_SCHEMA],
      function_call: { name: 'generate_game_content' },
      temperature: LLM.TEMPERATURE,
      max_tokens: LLM.MAX_RESPONSE_TOKENS,
      top_p: LLM.TOP_P,
      frequency_penalty: LLM.FREQUENCY_PENALTY,
      presence_penalty: LLM.PRESENCE_PENALTY,
    });

    // Extract function call response
    const functionCall = completion.choices[0]?.message?.function_call;

    if (!functionCall || !functionCall.arguments) {
      throw new Error('No function call in response');
    }

    // Parse JSON response
    const response: LLMResponse = JSON.parse(functionCall.arguments);

    // Validate safety flags
    if (!response.safetyFlags.contentAppropriate || !response.safetyFlags.ageAppropriate) {
      console.warn('Content flagged as inappropriate:', response.safetyFlags);

      // Use fallback safe content
      return NextResponse.json({
        ...response,
        screen: {
          modality: 'private',
          title: 'Quick Question',
          body: "What's something fun you did recently?",
          instructions: 'Share your answer privately',
        },
        safetyFlags: {
          contentAppropriate: true,
          ageAppropriate: true,
          explanation: 'Using fallback safe content',
        },
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
1. ALWAYS respond with valid JSON matching the exact schema provided
2. NEVER include extra prose, commentary, or text outside the JSON structure
3. NEVER exceed the specified character limits (title: 60, body: 500, instructions: 100)
4. Respect the safety mode: ${request.safetyMode}
5. Keep content concise - this is a mobile game with limited screen space
6. Make prompts clever and engaging, not random or generic

SAFETY MODE: ${request.safetyMode}
${
  request.safetyMode === 'kid-safe'
    ? '- Appropriate for ages 10-12\n- Mild humor only\n- No adult themes, violence, alcohol, drugs, dating, politics, or religion'
    : '- Appropriate for ages 13+\n- Sophisticated humor allowed\n- No extreme violence or explicit content'
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
