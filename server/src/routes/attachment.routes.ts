import { Router } from 'express';
import * as attachmentController from '../controllers/attachment.controller';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/task/:taskId', attachmentController.getAttachments);
router.post('/task/:taskId', upload.single('file'), attachmentController.createAttachment);
router.delete('/:attachmentId', attachmentController.deleteAttachment);

export default router;
