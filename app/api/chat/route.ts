import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { toolRegistry } from '@/lib/ai/tools';
import { mergeConfig, validateApiKey } from '@/lib/ai/config';
import type { ChatRequest, ChatResponse, ResponsesAPIInput } from '@/lib/ai/types';

export const runtime = 'nodejs'; // Required for tool execution + SDK

// Initialize OpenAI client
let openai: OpenAI;
try {
  validateApiKey();
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error);
}

/**
 * Convert chat messages to Responses API format
 */
function toResponsesAPIFormat(messages: ChatRequest['messages']): ResponsesAPIInput[] {
  return messages.map(msg => {
    if (msg.role === 'tool') {
      return {
        role: 'tool',
        content: [
          {
            type: 'tool_result',
            tool_call_id: msg.tool_call_id || '',
            output: msg.content,
          },
        ],
      };
    }

    return {
      role: msg.role as 'user' | 'assistant' | 'system',
      content: [
        {
          type: msg.role === 'assistant' ? 'output_text' : 'input_text',
          text: msg.content,
        },
      ],
    };
  });
}

/**
 * POST /api/chat - Main chat endpoint
 */
export async function POST(req: NextRequest) {
  try {
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI client not initialized. Check OPENAI_API_KEY.' },
        { status: 500 }
      );
    }

    const body: ChatRequest = await req.json();
    const { messages, config: userConfig } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Merge user config with defaults
    const config = mergeConfig(userConfig);

    // Get tool definitions
    const tools = config.tools.length > 0
      ? toolRegistry.getDefinitions(config.tools)
      : toolRegistry.getDefinitions();

    // Convert messages to Responses API format
    let input = toResponsesAPIFormat(messages);

    // Tool execution loop
    let iterations = 0;
    const MAX_ITERATIONS = 10; // Prevent infinite loops

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      // Call OpenAI Responses API
      const response = await openai.responses.create({
        model: config.model,
        input,
        tools: tools.length > 0 ? tools : undefined,
        // Optional: reasoning effort for GPT-5.2
        ...(config.reasoningEffort && {
          reasoning: { effort: config.reasoningEffort },
        }),
      });

      // Extract tool calls from response
      const toolCalls = response.output?.filter(
        (o: any) => o.type === 'tool_call'
      ) ?? [];

      // If no tool calls, return the final text
      if (toolCalls.length === 0) {
        const textParts = response.output
          ?.filter((o: any) => o.type === 'message')
          ?.flatMap((m: any) => m.content)
          ?.filter((c: any) => c.type === 'output_text')
          ?.map((c: any) => c.text) ?? [];

        const result: ChatResponse = {
          text: textParts.join(''),
          usage: response.usage,
        };

        return NextResponse.json(result);
      }

      // Execute tool calls and add results to input
      for (const call of toolCalls) {
        try {
          // Parse arguments
          const args = call.arguments ? JSON.parse(call.arguments) : {};

          // Execute tool
          const result = await toolRegistry.execute(call.name, args);

          // Add tool result to input
          input.push({
            role: 'tool',
            content: [
              {
                type: 'tool_result',
                tool_call_id: call.id,
                output: JSON.stringify(result),
              },
            ],
          });

          console.log(`Executed tool: ${call.name}`, { args, result });
        } catch (error) {
          console.error(`Tool execution failed: ${call.name}`, error);

          // Send error as tool result
          input.push({
            role: 'tool',
            content: [
              {
                type: 'tool_result',
                tool_call_id: call.id,
                output: JSON.stringify({
                  error: error instanceof Error ? error.message : 'Unknown error',
                }),
              },
            ],
          });
        }
      }

      // Continue loop to get final response
    }

    // If we hit max iterations
    return NextResponse.json(
      { error: 'Max tool execution iterations reached' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat - Health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    model: 'gpt-5.2',
    tools: toolRegistry.getDefinitions().map(t => t.name),
  });
}
