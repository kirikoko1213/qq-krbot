import axios from 'axios';
import {
  MCPTool,
  MCPToolDefinition,
  WeatherToolArgs,
  WeatherResponse,
} from './types.js';
import { Logger } from '../../utils/logger.js';

/**
 * 天气工具定义
 */
export const weatherToolDefinition: MCPToolDefinition = {
  name: 'weather',
  description:
    '获取一个城市的天气，需要提供中文城市名称，如北京，上海，南京，广州等，用户必须明确指定查看天气相关信息时才调用',
  inputSchema: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description: '中文城市名称',
      },
    },
    required: ['city'],
  },
};

/**
 * 获取天气信息
 */
async function getWeather(city: string): Promise<string> {
  const baseURL = 'http://apis.juhe.cn/simpleWeather/query';
  const apiKey = process.env.JUHE_KEY_SIMPLE_WEATHER;

  if (!apiKey) {
    throw new Error(
      '缺少聚合数据天气API密钥，请设置环境变量 JUHE_KEY_SIMPLE_WEATHER'
    );
  }

  try {
    const response = await axios.get<WeatherResponse>(baseURL, {
      params: {
        city,
        key: apiKey,
      },
      timeout: 10000,
    });

    const { result } = response.data;
    if (!result || !result.city) {
      throw new Error(`无法获取城市 "${city}" 的天气信息`);
    }

    const {
      city: cityName,
      realtime: { info, temperature, humidity, power, direct, aqi },
    } = result;

    return [
      `城市: ${cityName}`,
      `天气: ${info}`,
      `温度: ${temperature}`,
      `湿度: ${humidity}`,
      `风力: ${power}`,
      `风向: ${direct}`,
      `空气质量: ${aqi}`,
    ].join('\n');
  } catch (error) {
    Logger.error('获取天气信息失败', { city, error });
    throw new Error(
      `获取天气信息失败: ${error instanceof Error ? error.message : error}`
    );
  }
}

/**
 * 天气工具处理函数
 */
export async function handleWeatherTool(args: Record<string, any>) {
  try {
    const { city } = args as WeatherToolArgs;

    if (!city || typeof city !== 'string') {
      return {
        success: false,
        content: '',
        error: '城市名称是必需的参数',
      };
    }

    const weather = await getWeather(city);

    return {
      success: true,
      content: weather,
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
 * 天气工具完整定义
 */
export const weatherTool: MCPTool = {
  definition: weatherToolDefinition,
  handler: handleWeatherTool,
};
