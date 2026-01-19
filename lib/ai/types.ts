import type OpenAI from 'openai';

// Chat message format
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

// Tool call structure
export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

// Tool definition (JSON schema)
export interface ToolDefinition {
  type: 'function';
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
    additionalProperties?: boolean;
  };
}

// Tool execution function
export type ToolExecutor = (args: any) => Promise<any>;

// Tool registry entry
export interface Tool {
  definition: ToolDefinition;
  execute: ToolExecutor;
}

// AI request configuration
export interface AIRequestConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: string[]; // tool names to enable
  reasoningEffort?: 'low' | 'medium' | 'high' | 'xhigh';
  stream?: boolean;
}

// API request body
export interface ChatRequest {
  messages: ChatMessage[];
  config?: AIRequestConfig;
}

// API response (non-streaming)
export interface ChatResponse {
  text: string;
  toolCalls?: ToolCall[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Responses API input format
export interface ResponsesAPIInput {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: Array<{
    type: 'input_text' | 'output_text' | 'tool_result';
    text?: string;
    tool_call_id?: string;
    output?: string;
  }>;
}
