import { MCPTool } from './types.js';
import { weatherTool } from './weatherTool.js';
import { qqGroupRankTool } from './qqTool.js';
import { dnfGoldTool } from './dnfGoldTool.js';
import { Logger } from '../../utils/logger.js';

/**
 * MCP工具注册表
 */
export class MCPToolRegistry {
  private tools: Map<string, MCPTool> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  /**
   * 注册默认工具
   */
  private registerDefaultTools(): void {
    this.registerTool(weatherTool);
    this.registerTool(qqGroupRankTool);
    this.registerTool(dnfGoldTool);

    Logger.info('MCP工具注册完成', {
      count: this.tools.size,
      tools: Array.from(this.tools.keys()),
    });
  }

  /**
   * 注册单个工具
   */
  registerTool(tool: MCPTool): void {
    const { name } = tool.definition;

    if (this.tools.has(name)) {
      Logger.warn('工具已存在，将被覆盖', { toolName: name });
    }

    this.tools.set(name, tool);
    Logger.info('工具注册成功', { toolName: name });
  }

  /**
   * 注销工具
   */
  unregisterTool(name: string): boolean {
    const removed = this.tools.delete(name);
    if (removed) {
      Logger.info('工具注销成功', { toolName: name });
    } else {
      Logger.warn('工具不存在', { toolName: name });
    }
    return removed;
  }

  /**
   * 获取工具
   */
  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * 获取所有工具定义
   */
  getAllToolDefinitions() {
    return Array.from(this.tools.values()).map(tool => tool.definition);
  }

  /**
   * 获取所有工具名称
   */
  getAllToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * 检查工具是否存在
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * 调用工具
   */
  async callTool(name: string, args: Record<string, any>) {
    const tool = this.getTool(name);

    if (!tool) {
      return {
        success: false,
        content: '',
        error: `工具 '${name}' 不存在`,
      };
    }

    try {
      Logger.info('调用MCP工具', { toolName: name, args });
      const result = await tool.handler(args);

      if (result.success) {
        Logger.info('MCP工具调用成功', {
          toolName: name,
          contentLength: result.content.length,
        });
      } else {
        Logger.warn('MCP工具调用失败', {
          toolName: name,
          error: result.error,
        });
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      Logger.error('MCP工具调用异常', { toolName: name, error: errorMsg });

      return {
        success: false,
        content: '',
        error: `工具调用异常: ${errorMsg}`,
      };
    }
  }

  /**
   * 获取工具统计信息
   */
  getStats() {
    return {
      totalTools: this.tools.size,
      toolNames: this.getAllToolNames(),
      registeredAt: new Date().toISOString(),
    };
  }
}

/**
 * 全局工具注册表实例
 */
export const toolRegistry = new MCPToolRegistry();
