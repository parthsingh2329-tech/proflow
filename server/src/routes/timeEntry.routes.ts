import { Router } from 'express';
import * as timeEntryController from '../controllers/timeEntry.controller';
import { authenticate } from '../middleware/auth';
import { validate, createTimeEntrySchema } from '../validators/common';

const router = Router();

router.use(authenticate);

router.get('/task/:taskId', timeEntryController.getTimeEntries);
router.post('/task/:taskId', validate(createTimeEntrySchema), timeEntryController.createTimeEntry);
router.put('/:entryId', validate(createTimeEntrySchema.partial()), timeEntryController.updateTimeEntry);
router.delete('/:entryId', timeEntryController.deleteTimeEntry);
router.get('/project/:projectId', timeEntryController.getProjectTimeReport);
router.get('/project/:projectId/list', timeEntryController.getProjectTimeEntries);

export default router;
