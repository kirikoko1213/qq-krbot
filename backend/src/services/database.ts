import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger';

class DatabaseService {
  private static instance: DatabaseService;
  private _prisma: PrismaClient;

  private constructor() {
    this._prisma = new PrismaClient({
      errorFormat: 'pretty',
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public get prisma(): PrismaClient {
    return this._prisma;
  }

  // 连接数据库
  public async connect(): Promise<void> {
    try {
      await this._prisma.$connect();
      Logger.info('Database connected successfully');
    } catch (error) {
      Logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  // 断开数据库连接
  public async disconnect(): Promise<void> {
    try {
      await this._prisma.$disconnect();
      Logger.info('Database disconnected successfully');
    } catch (error) {
      Logger.error('Failed to disconnect from database:', error);
      throw error;
    }
  }

  // 检查数据库连接
  public async ping(): Promise<boolean> {
    try {
      await this._prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      Logger.error('Database ping failed:', error);
      return false;
    }
  }

  // 事务执行器，对应Go代码中的Transaction功能
  public async transaction<T>(
    callback: (prisma: any) => Promise<T>
  ): Promise<T> {
    return await this._prisma.$transaction(callback);
  }

  // 批量操作，对应Go代码中的GetBatchDB功能
  public async batchCreate<T>(
    model: any,
    data: T[],
    batchSize: number = 1000
  ): Promise<void> {
    const batches = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      await model.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }
  }

  // 检查是否为记录未找到错误
  public isNotFound(error: any): boolean {
    return error?.code === 'P2025';
  }
}

// 导出单例实例
export const dbService = DatabaseService.getInstance();
export default dbService;
