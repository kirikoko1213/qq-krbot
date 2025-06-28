import Router from 'koa-router';
import { GroupController } from '../controllers/groupController';

const router = new Router();
const groupController = new GroupController();

// 获取群组列表
router.get('/', groupController.getGroups);

// 根据 QQ 群 ID 获取群组
router.get('/:qqId', groupController.getGroupByQQId);

// 创建或更新群组
router.post('/', groupController.createOrUpdateGroup);

// 更新群组信息
router.put('/:qqId', groupController.updateGroup);

// 设置群组状态
router.put('/:qqId/status', groupController.setGroupStatus);

export default router;
