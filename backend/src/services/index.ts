import { MessageService } from './message.js';
import { dbService } from './database.js';
import GroupService from './group-service.js';

export const messageService = new MessageService();
export const groupService = new GroupService();

export { dbService };
