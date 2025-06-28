import { env } from 'process';
import dotenv from 'dotenv';
import path from 'path';

// 确保 dotenv 被加载
const envPath = path.resolve(process.cwd(), '.env');
console.log('正在加载环境变量文件:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn('⚠️  .env 文件加载失败:', result.error.message);
  console.log('请确保在项目根目录创建 .env 文件');
} else {
  console.log('✅ .env 文件加载成功');
}

/**
 * 配置管理工具
 */
const conf = {
  /**
   * 获取环境变量值
   * @param key 环境变量名
   * @param defaultValue 默认值（可选）
   * @returns 环境变量值或默认值
   */
  get: (key: string, defaultValue?: string): string | undefined => {
    const value = env[key] || defaultValue;
    console.log(`📋 配置读取: ${key} = ${value ? value : '未设置'}`);
    return value;
  },

  /**
   * 获取必需的环境变量，如果不存在则抛出错误
   * @param key 环境变量名
   * @returns 环境变量值
   */
  getRequired: (key: string): string => {
    const value = env[key];
    if (!value) {
      throw new Error(`必需的环境变量 ${key} 未设置`);
    }
    console.log(`📋 配置读取: ${key} = ***已设置***`);
    return value;
  },

  /**
   * 获取数字类型的环境变量
   * @param key 环境变量名
   * @param defaultValue 默认值
   * @returns 数字值
   */
  getNumber: (key: string, defaultValue: number): number => {
    const value = env[key];
    const numValue = value ? parseInt(value, 10) : defaultValue;
    console.log(`📋 配置读取: ${key} = ${numValue}`);
    return numValue;
  },

  /**
   * 获取布尔类型的环境变量
   * @param key 环境变量名
   * @param defaultValue 默认值
   * @returns 布尔值
   */
  getBoolean: (key: string, defaultValue: boolean): boolean => {
    const value = env[key];
    const boolValue = value ? value.toLowerCase() === 'true' : defaultValue;
    console.log(`📋 配置读取: ${key} = ${boolValue}`);
    return boolValue;
  },

  /**
   * 获取所有环境变量（用于调试）
   */
  debug: () => {
    console.log('🔍 所有环境变量:');
    Object.keys(env).forEach(key => {
      if (
        key.includes('API_KEY') ||
        key.includes('PASSWORD') ||
        key.includes('SECRET')
      ) {
        console.log(`  ${key}: ***隐藏***`);
      } else {
        console.log(`  ${key}: ${env[key]}`);
      }
    });
  },
};

export default conf;
