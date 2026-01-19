/**
 * Chat API Route
 *
 * Handles AI chat requests with GPT-5.2 and tool calling (function calling).
 * Implements a tool execution loop where the AI can call registered tools
 * and incorporate their results into responses.
 *
 * Security considerations:
 * - API keys are server-side only (never exposed to client)
 * - Tool execution happens server-side with proper error handling
 * - Rate limiting should be added for production (TODO: implement with Vercel KV)
 * - Request validation ensures messages array is provided
 * - Tool schemas use additionalProperties: false to prevent injection
 *
 * TODO for production:
 * - Add rate limiting per user/IP
 * - Add request size limits
 * - Add authentication check (currently public)
 * - Add monitoring/logging for security events
 * - Consider adding CORS restrictions if needed
 */
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { mergeConfig, validateApiKey } from '@/lib/ai/config';
import type { ChatRequest, ChatResponse } from '@/lib/ai/types';

export const runtime = 'nodejs'; // Required for tool execution + SDK
export const dynamic = 'force-dynamic'; // Prevent static analysis

// OpenAI client singleton
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    validateApiKey();
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

// Lazy-load toolRegistry to avoid build-time execution
function getToolRegistry() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { toolRegistry } = require('@/lib/ai/tools');
  return toolRegistry;
}

/**
 * Convert chat messages to OpenAI format
 */
function toChatCompletionMessages(
  messages: ChatRequest['messages']
): OpenAI.Chat.ChatCompletionMessageParam[] {
  return messages.map(msg => {
    if (msg.role === 'tool') {
      return {
        role: 'tool' as const,
        tool_call_id: msg.tool_call_id || '',
        content: msg.content,
      };
    }

    if (msg.role === 'assistant' && msg.tool_calls) {
      return {
        role: 'assistant' as const,
        content: msg.content,
        tool_calls: msg.tool_calls.map(tc => ({
          id: tc.id,
          type: 'function' as const,
          function: {
            name: tc.name,
            arguments: tc.arguments,
          },
        })),
      };
    }

    return {
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    };
  });
}

/**
 * POST /api/chat - Main chat endpoint
 */
export async function POST(req: NextRequest) {
  try {
    // Initialize OpenAI client
    const client = getOpenAIClient();

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

    // Get tool registry
    const registry = getToolRegistry();

    // Get tool definitions
    const toolDefs = config.tools.length > 0
      ? registry.getDefinitions(config.tools)
      : registry.getDefinitions();

    // Convert to OpenAI tools format
    const tools: OpenAI.Chat.ChatCompletionTool[] = toolDefs.map((def: any) => ({
      type: 'function' as const,
      function: {
        name: def.name,
        description: def.description,
        parameters: def.parameters,
      },
    }));

    // Convert messages to OpenAI format
    let chatMessages = toChatCompletionMessages(messages);

    // Tool execution loop
    let iterations = 0;
    const MAX_ITERATIONS = 10; // Prevent infinite loops

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      // Call OpenAI Chat Completions API
      const response = await client.chat.completions.create({
        model: config.model,
        messages: chatMessages,
        tools: tools.length > 0 ? tools : undefined,
        temperature: config.temperature,
        max_completion_tokens: config.maxTokens,
      });

      const choice = response.choices[0];
      const message = choice.message;

      // If no tool calls, return the final text
      if (!message.tool_calls || message.tool_calls.length === 0) {
        const result: ChatResponse = {
          text: message.content || '',
          usage: response.usage,
        };

        return NextResponse.json(result);
      }

      // Add assistant message with tool calls to history
      chatMessages.push({
        role: 'assistant',
        content: message.content || '',
        tool_calls: message.tool_calls,
      });

      // Execute tool calls and add results
      for (const toolCall of message.tool_calls) {
        try {
          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);

          // Execute tool
          const result = await registry.execute(functionName, args);

          // Add tool result to messages
          chatMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });

          console.log(`Executed tool: ${functionName}`, { args, result });
        } catch (error) {
          console.error(`Tool execution failed: ${toolCall.function.name}`, error);

          // Send error as tool result
          chatMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({
              error: error instanceof Error ? error.message : 'Unknown error',
            }),
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
  const registry = getToolRegistry();
  return NextResponse.json({
    status: 'ok',
    model: 'gpt-5.2',
    tools: registry.getDefinitions().map((t: any) => t.name),
  });
}
