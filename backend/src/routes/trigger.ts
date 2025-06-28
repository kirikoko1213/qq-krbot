import Router from 'koa-router';
import { TriggerController } from '../controllers/triggerController';

const router = new Router();
const triggerController = new TriggerController();

// 获取触发器列表
router.get('/', triggerController.getTriggers);

// 根据群组获取触发器
router.get('/group/:groupQQId', triggerController.getTriggersByGroup);

// 创建触发器
router.post('/', triggerController.createTrigger);

// 更新触发器
router.put('/:id', triggerController.updateTrigger);

// 删除触发器
router.delete('/:id', triggerController.deleteTrigger);

// 设置触发器状态
router.put('/:id/status', triggerController.setTriggerStatus);

// 测试触发器匹配
router.post('/test', triggerController.testTrigger);

export default router;
