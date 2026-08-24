import { Router } from 'express';
import * as commentController from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth';
import { validate, createCommentSchema } from '../validators/common';

const router = Router();

router.use(authenticate);

router.get('/task/:taskId', commentController.getComments);
router.post('/task/:taskId', validate(createCommentSchema), commentController.createComment);
router.put('/:commentId', validate(createCommentSchema), commentController.updateComment);
router.delete('/:commentId', commentController.deleteComment);

export default router;
