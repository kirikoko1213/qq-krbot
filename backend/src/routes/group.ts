import Router from 'koa-router';
import { GroupController } from '../controllers/groupController.js';

const router = new Router();
const groupController = new GroupController();

// 获取群组列表
router.get('/', groupController.getGroups);

// 根据 QQ 群 ID 获取群组成员列表
router.get('/:groupId/members', groupController.getGroupMembers);

// 更新群成员别名
router.post('/member/alias', groupController.updateGroupMemberAlias);

export default router;
