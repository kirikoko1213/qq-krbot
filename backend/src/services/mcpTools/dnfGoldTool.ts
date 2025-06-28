import axios from 'axios';
import { MCPTool, MCPToolDefinition, DNFGoldItem } from './types.js';
import { Logger } from '../../utils/logger.js';

/**
 * DNF金币价格工具定义
 */
export const dnfGoldToolDefinition: MCPToolDefinition = {
  name: 'dnf_gold',
  description:
    '获取 DNF 金币价格，DNF 是地下城与勇士的缩写，是一个网络游戏，数据来源是 UU898',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

/**
 * 获取DNF金币价格
 */
async function getDNFGoldPrice(): Promise<string> {
  const baseURL = 'http://www.uu898.com/ashx/GameRetail.ashx';

  try {
    const response = await axios.get(baseURL, {
      params: {
        act: 'a001',
        g: '95',
        a: '2335',
        s: '25080',
        c: '-3',
        cmp: '-1',
        _t: Date.now(),
      },
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const data = response.data;
    if (!data || !data.list || !data.list.datas) {
      throw new Error('DNF金币价格数据格式异常');
    }

    const goldItems: DNFGoldItem[] = data.list.datas;

    if (!goldItems || goldItems.length === 0) {
      return '暂无DNF金币价格数据';
    }

    let result = '💰 当前DNF金币价格：\n\n';

    goldItems.forEach((gold, index) => {
      const emoji = index === 0 ? '🔥' : index === 1 ? '⭐' : '💎';
      result += `${emoji} 比例: ${gold.Scale.toFixed(2)}万 / ¥1\n`;
      result += `   交易类型: ${gold.TradeType}\n\n`;
    });

    result += '📅 数据来源: UU898\n';
    result += `🕐 更新时间: ${new Date().toLocaleString('zh-CN')}`;

    return result;
  } catch (error) {
    Logger.error('获取DNF金币价格失败', error);
    throw new Error(
      `获取DNF金币价格失败: ${error instanceof Error ? error.message : error}`
    );
  }
}

/**
 * DNF金币价格工具处理函数
 */
export async function handleDNFGoldTool(args: Record<string, any>) {
  try {
    const goldPrice = await getDNFGoldPrice();

    return {
      success: true,
      content: goldPrice,
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
 * DNF金币价格工具完整定义
 */
export const dnfGoldTool: MCPTool = {
  definition: dnfGoldToolDefinition,
  handler: handleDNFGoldTool,
};
