/**
 * 将对象的所有键从下划线命名转换为驼峰命名
 * @param obj 包含下划线命名键的对象
 * @returns 包含驼峰命名键的新对象
 */
export function snakeToCamel<T extends Record<string, any>>(
  obj: T
): Record<string, any> {
  // 如果不是对象或为 null，直接返回
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  // 创建新的结果对象
  const result: Record<string, any> = {};

  // 处理对象的每个键
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // 转换键名为驼峰命名
      const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase()
      );

      // 如果值是对象，递归转换其内部键
      const value = obj[key];
      result[camelKey] =
        typeof value === 'object' && value !== null
          ? snakeToCamel(value)
          : value;
    }
  }

  return result;
}

// 使用示例
type UserResponse = {
  user_id: number;
  user_name: string;
  user_email: string;
  created_at: string;
  profile: {
    profile_id: number;
    user_sex: string;
    birth_date: string;
  };
  login_history: Array<{
    login_time: string;
    login_ip: string;
  }>;
};
