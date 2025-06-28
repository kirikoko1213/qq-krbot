import { MessageService } from './message';
import { dbService } from './database';
import { RepositoryFactory } from '../repositories';
import GroupService from './group-service';

export const messageService = new MessageService();
export const groupService = new GroupService();

export { dbService };
export { RepositoryFactory };

// 导出Repository实例的便捷方法
export const repositories = RepositoryFactory.getAllRepositories();
