import { sutando } from 'sutando';
import { Logger } from '../utils/logger.js';
import conf from '@/handlers/config/config.js';

class DatabaseService {
  private static instance: DatabaseService;
  private _connection: any;
  private _initialized: boolean = false;

  private constructor() {
    // 同步初始化 Sutando 连接（使用环境变量）
    this.initializeSync();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // 同步初始化 Sutando 连接（使用环境变量）
  private async initializeSync(): Promise<void> {
    try {
      // 配置 Sutando 连接
      sutando.addConnection(
        {
          client: 'mysql2',
          connection: {
            host: await conf.get('DEFAULT.DB_HOST'),
            port: await conf.get('DEFAULT.DB_PORT'),
            user: await conf.get('DEFAULT.DB_USER'),
            password: await conf.get('DEFAULT.DB_PASSWORD'),
            database: await conf.get('DEFAULT.DB_NAME'),
          },
          debug: false, // 可以根据环境设置
        },
        'default'
      );

      this._connection = sutando.connection();
      this._initialized = true;
      Logger.info('Sutando database connection initialized successfully');
    } catch (error) {
      Logger.error('Failed to initialize database connection:', error);
      throw error;
    }
  }

  // 异步初始化方法（保持向后兼容）
  public async initialize(): Promise<void> {
    // 现在同步初始化已经在构造函数中完成
    if (this._initialized) {
      return;
    }
    throw new Error('Database initialization failed in constructor');
  }

  // 获取连接
  public get connection() {
    if (!this._initialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this._connection;
  }

  // 连接数据库
  public async connect(): Promise<void> {
    try {
      if (!this._initialized) {
        throw new Error('Database not initialized. Call initialize() first.');
      }
      Logger.info('Database connected successfully');
    } catch (error) {
      Logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  // 断开数据库连接
  public async disconnect(): Promise<void> {
    try {
      if (this._connection) {
        await this._connection.destroy();
        this._initialized = false;
        Logger.info('Database disconnected successfully');
      }
    } catch (error) {
      Logger.error('Failed to disconnect from database:', error);
      throw error;
    }
  }

  // 检查数据库连接
  public async ping(): Promise<boolean> {
    try {
      if (!this._initialized) {
        throw new Error('Database not initialized');
      }
      // 使用 Sutando 的方式检查连接
      await this._connection.raw('SELECT 1');
      return true;
    } catch (error) {
      Logger.error('Database ping failed:', error);
      return false;
    }
  }

  // 事务执行器
  public async transaction<T>(callback: (trx: any) => Promise<T>): Promise<T> {
    if (!this._initialized) {
      throw new Error('Database not initialized');
    }
    return await this._connection.transaction(callback);
  }

  // 批量操作
  public async batchInsert(
    tableName: string,
    data: any[],
    batchSize: number = 1000
  ): Promise<void> {
    if (!this._initialized) {
      throw new Error('Database not initialized');
    }

    const batches = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      await this._connection.table(tableName).insert(batch);
    }
  }

  // 执行原始 SQL
  public async raw(query: string, bindings?: any[]): Promise<any> {
    if (!this._initialized) {
      throw new Error('Database not initialized');
    }
    return await this._connection.raw(query, bindings);
  }
}

// 导出单例实例
export const dbService = DatabaseService.getInstance();
export default dbService;
