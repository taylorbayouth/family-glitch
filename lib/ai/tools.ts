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
// LAZY-LOAD TEMPLATE TOOLS
// ============================================

/**
 * Template tools must be lazy-loaded to avoid circular dependency.
 *
 * Issue: template-tools.ts imports registerTool from this file,
 * and registerTool uses toolRegistry. If we import template-tools
 * at module level, toolRegistry won't be initialized yet.
 *
 * Solution: Load template tools on first access to the registry.
 */
let templateToolsLoaded = false;

export function ensureTemplateToolsLoaded() {
  if (!templateToolsLoaded) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('./template-tools');
    templateToolsLoaded = true;
  }
}
