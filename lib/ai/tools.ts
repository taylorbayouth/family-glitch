import { Tool, ToolDefinition, ToolExecutor } from './types';

/**
 * Tool Registry - Centralized tool management
 */
class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  /**
   * Register a new tool
   */
  register(definition: ToolDefinition, execute: ToolExecutor): void {
    this.tools.set(definition.name, { definition, execute });
  }

  /**
   * Get tool by name
   */
  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tool definitions (for API requests)
   */
  getDefinitions(toolNames?: string[]): ToolDefinition[] {
    if (toolNames) {
      return toolNames
        .map(name => this.tools.get(name)?.definition)
        .filter((def): def is ToolDefinition => def !== undefined);
    }
    return Array.from(this.tools.values()).map(t => t.definition);
  }

  /**
   * Execute a tool by name
   */
  async execute(name: string, args: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return tool.execute(args);
  }

  /**
   * Check if a tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }
}

// Singleton instance
export const toolRegistry = new ToolRegistry();

/**
 * Helper to register a tool with type safety
 */
export function registerTool<T = any>(
  definition: ToolDefinition,
  execute: (args: T) => Promise<any>
): void {
  toolRegistry.register(definition, execute);
}

// ============================================
// EXAMPLE TOOLS - Replace with your own
// ============================================

/**
 * Example: Lookup customer tool
 */
registerTool<{ email: string }>(
  {
    type: 'function',
    name: 'lookup_customer',
    description: 'Fetch a customer record by email address',
    parameters: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Customer email address',
        },
      },
      required: ['email'],
      additionalProperties: false,
    },
  },
  async ({ email }) => {
    // TODO: Replace with actual DB call
    console.log('Looking up customer:', email);
    return {
      email,
      name: 'John Doe',
      plan: 'pro',
      status: 'active',
    };
  }
);

/**
 * Example: Get current time tool
 */
registerTool(
  {
    type: 'function',
    name: 'get_current_time',
    description: 'Get the current server time',
    parameters: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  async () => {
    return {
      timestamp: new Date().toISOString(),
      timezone: 'UTC',
    };
  }
);

/**
 * Example: Calculate tool
 */
registerTool<{ expression: string }>(
  {
    type: 'function',
    name: 'calculate',
    description: 'Evaluate a mathematical expression',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Math expression to evaluate (e.g., "2 + 2")',
        },
      },
      required: ['expression'],
      additionalProperties: false,
    },
  },
  async ({ expression }) => {
    try {
      // Simple eval - in production, use a safe math parser
      const result = Function(`"use strict"; return (${expression})`)();
      return { result, expression };
    } catch (error) {
      return { error: 'Invalid expression', expression };
    }
  }
);
