import { ContextStorage, Message, SessionInfo } from './types.js';
import { Logger } from '../utils/logger.js';

/**
 * 内存上下文存储实现
 * 提供基于内存的会话和消息存储功能
 */
export class MemoryContextStorage implements ContextStorage {
  private sessions: Map<string, Message[]> = new Map();
  private sessionInfo: Map<string, SessionInfo> = new Map();
  private maxMessages: number;

  /**
   * 创建内存存储实例
   * @param maxMessages 每个会话最大消息数量，默认 100
   */
  constructor(maxMessages: number = 100) {
    if (maxMessages <= 0) {
      maxMessages = 100;
    }
    this.maxMessages = maxMessages;
  }

  /**
   * 保存消息到指定会话
   */
  async saveMessage(sessionId: string, message: Message): Promise<void> {
    if (!sessionId) {
      throw new Error('会话 ID 不能为空');
    }

    // 初始化会话（如果不存在）
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);
      this.sessionInfo.set(sessionId, {
        sessionId,
        messageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        firstMessage: '',
      });
    }

    const messages = this.sessions.get(sessionId)!;
    messages.push(message);

    // 限制消息数量（保留最新的消息）
    if (messages.length > this.maxMessages) {
      // 保留系统消息（如果第一条是系统消息）
      let start = 0;
      if (messages.length > 0 && messages[0].role === 'system') {
        start = 1;
      }

      // 保留系统消息 + 最新的消息
      const keepCount = this.maxMessages - start;
      const newMessages: Message[] = [];

      if (start > 0) {
        newMessages.push(messages[0]); // 保留系统消息
      }

      // 保留最新的消息
      const startIndex = messages.length - keepCount;
      newMessages.push(...messages.slice(startIndex));

      this.sessions.set(sessionId, newMessages);
    }

    // 更新会话信息
    const info = this.sessionInfo.get(sessionId)!;
    info.messageCount = this.sessions.get(sessionId)!.length;
    info.updatedAt = new Date();

    // 设置第一条消息内容（用于显示）
    if (!info.firstMessage && messages.length > 0) {
      const firstMsg = messages[0];
      if (firstMsg.role === 'system' && messages.length > 1) {
        info.firstMessage = messages[1].content;
      } else {
        info.firstMessage = firstMsg.content;
      }

      // 截断显示内容
      if (info.firstMessage.length > 50) {
        info.firstMessage = info.firstMessage.substring(0, 50) + '...';
      }
    }
  }

  /**
   * 加载指定会话的所有消息
   */
  async loadMessages(sessionId: string): Promise<Message[]> {
    if (!sessionId) {
      return [];
    }

    const messages = this.sessions.get(sessionId);
    if (!messages) {
      return [];
    }

    // 返回副本以避免外部修改
    return messages.map(msg => ({ ...msg }));
  }

  /**
   * 清空指定会话的所有消息
   */
  async clearSession(sessionId: string): Promise<void> {
    if (!sessionId) {
      throw new Error('会话 ID 不能为空');
    }

    if (this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);

      // 重置会话信息
      const info = this.sessionInfo.get(sessionId);
      if (info) {
        info.messageCount = 0;
        info.updatedAt = new Date();
        info.firstMessage = '';
      }
    }
  }

  /**
   * 删除指定会话
   */
  async deleteSession(sessionId: string): Promise<void> {
    if (!sessionId) {
      throw new Error('会话 ID 不能为空');
    }

    this.sessions.delete(sessionId);
    this.sessionInfo.delete(sessionId);
  }

  /**
   * 列出所有会话 ID
   */
  async listSessions(): Promise<string[]> {
    return Array.from(this.sessions.keys());
  }

  /**
   * 获取会话信息
   */
  async getSessionInfo(sessionId: string): Promise<SessionInfo | null> {
    const info = this.sessionInfo.get(sessionId);
    if (!info) {
      return null;
    }

    // 返回副本
    return { ...info };
  }

  /**
   * 获取指定会话的消息数量
   */
  getMessageCount(sessionId: string): number {
    const messages = this.sessions.get(sessionId);
    return messages ? messages.length : 0;
  }

  /**
   * 获取所有会话信息
   */
  async getAllSessionsInfo(): Promise<SessionInfo[]> {
    const result: SessionInfo[] = [];

    for (const info of this.sessionInfo.values()) {
      result.push({ ...info });
    }

    return result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * 获取存储统计信息
   */
  getStats() {
    const totalSessions = this.sessions.size;
    let totalMessages = 0;

    for (const messages of this.sessions.values()) {
      totalMessages += messages.length;
    }

    return {
      totalSessions,
      totalMessages,
      maxMessages: this.maxMessages,
      averageMessagesPerSession:
        totalSessions > 0 ? totalMessages / totalSessions : 0,
    };
  }
}

/**
 * 数据库上下文存储基类
 * 可以继承此类实现具体的数据库存储
 */
export abstract class DatabaseContextStorage implements ContextStorage {
  abstract saveMessage(sessionId: string, message: Message): Promise<void>;
  abstract loadMessages(sessionId: string): Promise<Message[]>;
  abstract clearSession(sessionId: string): Promise<void>;
  abstract deleteSession(sessionId: string): Promise<void>;
  abstract listSessions(): Promise<string[]>;
  abstract getSessionInfo(sessionId: string): Promise<SessionInfo | null>;

  /**
   * 验证会话 ID
   */
  protected validateSessionId(sessionId: string): void {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('会话 ID 必须是非空字符串');
    }
  }

  /**
   * 验证消息
   */
  protected validateMessage(message: Message): void {
    if (!message || typeof message !== 'object') {
      throw new Error('消息必须是有效对象');
    }

    if (
      !message.role ||
      !['system', 'user', 'assistant'].includes(message.role)
    ) {
      throw new Error('消息角色必须是 system、user 或 assistant');
    }

    if (typeof message.content !== 'string') {
      throw new Error('消息内容必须是字符串');
    }
  }
}

/**
 * 创建默认的内存存储实例
 */
export function createMemoryStorage(
  maxMessages?: number
): MemoryContextStorage {
  return new MemoryContextStorage(maxMessages);
}

/**
 * 存储工厂函数
 */
export class StorageFactory {
  /**
   * 创建内存存储
   */
  static createMemoryStorage(maxMessages?: number): MemoryContextStorage {
    return new MemoryContextStorage(maxMessages);
  }

  /**
   * 创建数据库存储（需要具体实现）
   */
  static createDatabaseStorage(config: any): DatabaseContextStorage {
    throw new Error('数据库存储需要具体实现');
  }
}
