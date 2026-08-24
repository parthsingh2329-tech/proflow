import { Router } from 'express';
import * as changeController from '../controllers/changeManagement.controller';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/:projectId/changes', changeController.getChanges);
router.post('/:projectId/changes', changeController.createChange);
router.put('/changes/:ecoId', changeController.updateChange);
router.patch('/changes/:ecoId', changeController.updateChange);
router.post('/changes/:ecoId/review', changeController.reviewChange);
router.delete('/changes/:ecoId', changeController.deleteChange);

export default router;
