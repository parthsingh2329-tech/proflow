import { Router } from 'express';
import * as milestoneController from '../controllers/milestone.controller';
import { authenticate } from '../middleware/auth';
import { validate, createMilestoneSchema } from '../validators/common';

const router = Router();

router.use(authenticate);

router.get('/project/:projectId', milestoneController.getMilestones);
router.post('/project/:projectId', validate(createMilestoneSchema), milestoneController.createMilestone);
router.put('/:milestoneId', validate(createMilestoneSchema.partial()), milestoneController.updateMilestone);
router.delete('/:milestoneId', milestoneController.deleteMilestone);

export default router;
