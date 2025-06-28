import { Context } from 'koa';
import { Logger } from '../utils/logger';
import { MCPManager } from '../services/mcpManager';

export class MCPController {
  private mcpManager: MCPManager;

  constructor() {
    this.mcpManager = new MCPManager();
  }

  // 获取 MCP 工具列表
  async getTools(ctx: Context) {
    try {
      const tools = await this.mcpManager.getAvailableTools();

      ctx.body = {
        success: true,
        data: {
          tools,
          count: tools.length,
        },
      };
    } catch (error) {
      Logger.error('获取 MCP 工具列表失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: '获取工具列表失败' };
    }
  }

  // 调用 MCP 工具
  async invokeTool(ctx: Context) {
    try {
      const { toolName } = ctx.params;
      const { arguments: toolArgs } = ctx.request.body as any;

      if (!toolName) {
        ctx.status = 400;
        ctx.body = { success: false, message: '工具名称不能为空' };
        return;
      }

      const result = await this.mcpManager.invokeTool(toolName, toolArgs || {});

      ctx.body = {
        success: true,
        data: {
          toolName,
          result,
        },
      };
    } catch (error) {
      Logger.error(`调用 MCP 工具 ${ctx.params.toolName} 失败:`, error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: `调用工具失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }

  // 获取 MCP 服务器状态
  async getStatus(ctx: Context) {
    try {
      const status = await this.mcpManager.getConnectionStatus();

      ctx.body = {
        success: true,
        data: {
          isConnected: status.isConnected,
          serverUrl: status.serverUrl,
          lastConnected: status.lastConnected,
          error: status.error,
        },
      };
    } catch (error) {
      Logger.error('获取 MCP 服务器状态失败:', error);
      ctx.status = 500;
      ctx.body = { success: false, message: '获取服务器状态失败' };
    }
  }

  // 重新连接 MCP 服务器
  async reconnect(ctx: Context) {
    try {
      await this.mcpManager.reconnect();

      ctx.body = {
        success: true,
        message: 'MCP 服务器重连成功',
      };
    } catch (error) {
      Logger.error('重连 MCP 服务器失败:', error);
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: `重连失败: ${error instanceof Error ? error.message : '未知错误'}`,
      };
    }
  }
}
