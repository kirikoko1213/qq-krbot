import { MessageService } from './message';
import { dbService } from './database';
import * as repositories from '../repositories';
import GroupService from './group-service';

export const messageService = new MessageService();
export const groupService = new GroupService();

export { dbService };
export { repositories };
