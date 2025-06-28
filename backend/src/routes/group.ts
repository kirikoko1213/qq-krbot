import Router from 'koa-router';
import { GroupController } from '../controllers/groupController';

const router = new Router();
const groupController = new GroupController();

// 获取群组列表
router.get('/', groupController.getGroups);

// 根据 QQ 群 ID 获取群组成员列表
router.get('/:groupId/members', groupController.getGroupMembers);

export default router;
