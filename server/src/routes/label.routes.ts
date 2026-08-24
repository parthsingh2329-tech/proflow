import { Router } from 'express';
import * as labelController from '../controllers/label.controller';
import { authenticate } from '../middleware/auth';
import { validate, createLabelSchema } from '../validators/common';

const router = Router();

router.use(authenticate);

router.get('/project/:projectId', labelController.getLabels);
router.post('/project/:projectId', validate(createLabelSchema), labelController.createLabel);
router.put('/:labelId', validate(createLabelSchema.partial()), labelController.updateLabel);
router.delete('/:labelId', labelController.deleteLabel);

export default router;
