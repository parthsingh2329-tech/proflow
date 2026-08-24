import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', dashboardController.getDashboardStats);
router.get('/project/:projectId', dashboardController.getProjectAnalytics);
router.get('/activity', dashboardController.getRecentActivity);

export default router;
