import Router from 'koa-router';
import { UserController } from '../controllers/userController';

const router = new Router();
const userController = new UserController();

// 获取用户列表
router.get('/', userController.getUsers);

// 根据 QQ ID 获取用户
router.get('/:qqId', userController.getUserByQQId);

// 创建或更新用户
router.post('/', userController.createOrUpdateUser);

// 更新用户信息
router.put('/:qqId', userController.updateUser);

// 增加用户经验值
router.post('/:qqId/exp', userController.addExp);

// 增加用户金币
router.post('/:qqId/coins', userController.addCoins);

export default router;
