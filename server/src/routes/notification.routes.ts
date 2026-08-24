import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.put('/mark-all-read', notificationController.markAllAsRead);
router.put('/:notificationId/read', notificationController.markAsRead);

export default router;
