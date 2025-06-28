/**
 * MCP 工具的基础接口
 */
export interface MCPToolDefinition {
  /** 工具名称 */
  name: string;
  /** 工具描述 */
  description: string;
  /** 输入参数 schema */
  inputSchema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

/**
 * 工具执行结果
 */
export interface MCPToolResult {
  /** 执行是否成功 */
  success: boolean;
  /** 返回内容 */
  content: string;
  /** 错误信息（如果失败） */
  error?: string;
}

/**
 * 工具处理函数类型
 */
export type MCPToolHandler = (
  args: Record<string, any>
) => Promise<MCPToolResult>;

/**
 * 完整的工具定义
 */
export interface MCPTool {
  /** 工具定义 */
  definition: MCPToolDefinition;
  /** 处理函数 */
  handler: MCPToolHandler;
}

/**
 * 天气工具参数
 */
export interface WeatherToolArgs {
  city: string;
}

/**
 * QQ群排行榜工具参数
 */
export interface QQGroupRankToolArgs {
  groupId: string;
}

/**
 * DNF金币价格响应数据
 */
export interface DNFGoldItem {
  Scale: number;
  TradeType: string;
}

/**
 * 天气API响应数据
 */
export interface WeatherResponse {
  result: {
    city: string;
    realtime: {
      info: string;
      temperature: string;
      humidity: string;
      power: string;
      direct: string;
      aqi: string;
    };
  };
}
