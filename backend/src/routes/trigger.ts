import Router from 'koa-router';
import { TriggerController } from '../controllers/triggerController.js';

const router = new Router();
const triggerController = new TriggerController();

export default router;
