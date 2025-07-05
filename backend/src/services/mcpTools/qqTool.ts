import { MCPTool, MCPToolDefinition, QQGroupRankToolArgs } from './types.js';
import { Logger } from '../../utils/logger.js';
import { MessageRecordModel } from '../../repositories/index.js';

/**
 * QQ群消息排行榜工具定义
 */
export const qqGroupRankToolDefinition: MCPToolDefinition = {
  name: 'qq_group_message_rank',
  description: '获取QQ群消息每个人的发言排行榜',
  inputSchema: {
    type: 'object',
    properties: {
      groupId: {
        type: 'string',
        description: 'QQ群ID',
      },
    },
    required: ['groupId'],
  },
};

/**
 * 获取QQ群消息排行榜
 */
async function getQQGroupMessageRank(groupId: string): Promise<string> {
  try {
    // 获取今日消息排行（前5名）
    const rankArray = await MessageRecordModel.getRankWithGroupAndToday(
      groupId,
      5
    );

    if (!rankArray || rankArray.length === 0) {
      return `群 ${groupId} 今日暂无消息记录`;
    }

    // 构建排行榜字符串
    let result = `📊 群 ${groupId} 今日发言排行榜：\n\n`;

    rankArray.forEach((record: any, index: number) => {
      const medal =
        index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📍';
      result += `${medal} 第${index + 1}名: ${record.memberAlias || record.memberId}\n`;
      result += `   发言次数: ${record.messageCount}条\n\n`;
    });

    return result.trim();
  } catch (error) {
    Logger.error('获取QQ群排行榜失败', { groupId, error });
    throw new Error(
      `获取群排行榜失败: ${error instanceof Error ? error.message : error}`
    );
  }
}

/**
 * QQ群排行榜工具处理函数
 */
export async function handleQQGroupRankTool(args: Record<string, any>) {
  try {
    const { groupId } = args as QQGroupRankToolArgs;

    if (!groupId || typeof groupId !== 'string') {
      return {
        success: false,
        content: '',
        error: 'QQ群ID是必需的参数',
      };
    }

    const rank = await getQQGroupMessageRank(groupId);

    return {
      success: true,
      content: rank,
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * QQ群排行榜工具完整定义
 */
export const qqGroupRankTool: MCPTool = {
  definition: qqGroupRankToolDefinition,
  handler: handleQQGroupRankTool,
};
