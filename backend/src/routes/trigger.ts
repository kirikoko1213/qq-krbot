import Router from 'koa-router';
import { TriggerController } from '../controllers/triggerController.js';

const router = new Router();
const triggerController = new TriggerController();

router.get('/list', triggerController.getTriggers);
router.post('/save', triggerController.saveTrigger);
router.post('/delete', triggerController.deleteTrigger);
router.get('/:id', triggerController.getTrigger);
router.post('/move-up', triggerController.moveUpTrigger);
router.post('/move-down', triggerController.moveDownTrigger);

export default router;
