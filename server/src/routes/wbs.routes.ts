import { Router } from 'express';
import * as wbsController from '../controllers/wbs.controller';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/:projectId/wbs', wbsController.getWBS);
router.post('/:projectId/wbs', wbsController.createWBSNode);
router.post('/:projectId/wbs/promote-task', wbsController.promoteTask);
router.put('/wbs/:nodeId', wbsController.updateWBSNode);
router.patch('/wbs/:nodeId', wbsController.updateWBSNode);
router.delete('/wbs/:nodeId', wbsController.deleteWBSNode);

export default router;
