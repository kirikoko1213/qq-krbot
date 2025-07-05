import path from 'path';
import {
  createMySQLStorage,
  createPropertiesStorage,
  Handler,
  initialize,
} from 'candy-conf';

const createLocalHandler = () => {
  // 创建 Properties 存储
  const storage = createPropertiesStorage(
    path.resolve(process.cwd(), 'config.properties')
  );
  return initialize(storage);
};

const createDBHandler = async (localHandler: Handler): Promise<Handler> => {
  const [DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME] = await Promise.all([
    localHandler.get('DB_HOST'),
    localHandler.get('DB_PORT'),
    localHandler.get('DB_USER'),
    localHandler.get('DB_PASSWORD'),
    localHandler.get('DB_NAME'),
  ]);
  const storage = createMySQLStorage(
    DB_HOST,
    Number(DB_PORT),
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    'easy_config_items'
  );
  return initialize(storage, 'main');
};

const localHandler: Handler = createLocalHandler();
const dbHandler: Handler = await createDBHandler(localHandler);

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
  get: async (
    key: string,
    defaultValue?: string
  ): Promise<string | undefined> => {
    // 先从数据库读取
    const value = await dbHandler.get(key);
    if (value) {
      return value;
    }
    // 如果数据库没有，则从本地读取
    const localValue = await localHandler.get(key);
    return localValue || defaultValue;
  },
};

export default conf;
