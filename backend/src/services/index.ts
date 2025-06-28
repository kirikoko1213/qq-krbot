import { MessageService } from './message';
import { dbService } from './database';
import { RepositoryFactory } from './repositories';

export const messageService = new MessageService();
export { dbService };
export { RepositoryFactory };

// 导出Repository实例的便捷方法
export const repositories = RepositoryFactory.getAllRepositories();
