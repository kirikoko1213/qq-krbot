import Router from 'koa-router';
import { MessageController } from '../controllers/messageController.js';

const router = new Router();
const messageController = new MessageController();

router.post('/receive', messageController.receiveMessage);

export default router;
