import { Router } from 'express';
import * as controlsController from '../controllers/projectControls.controller';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.use(authenticate);

// RISKS
router.get('/:projectId/risks', controlsController.getRisks);
router.post('/:projectId/risks', controlsController.createRisk);
router.put('/risks/:riskId', controlsController.updateRisk);
router.patch('/risks/:riskId', controlsController.updateRisk);
router.delete('/risks/:riskId', controlsController.deleteRisk);

// ISSUES
router.get('/:projectId/issues', controlsController.getIssues);
router.post('/:projectId/issues', controlsController.createIssue);
router.put('/issues/:issueId', controlsController.updateIssue);
router.patch('/issues/:issueId', controlsController.updateIssue);
router.delete('/issues/:issueId', controlsController.deleteIssue);

// DECISIONS
router.get('/:projectId/decisions', controlsController.getDecisions);
router.post('/:projectId/decisions', controlsController.createDecision);
router.put('/decisions/:decisionId', controlsController.updateDecision);
router.patch('/decisions/:decisionId', controlsController.updateDecision);
router.delete('/decisions/:decisionId', controlsController.deleteDecision);

// BASELINES
router.get('/:projectId/baselines', controlsController.getBaselines);
router.post('/:projectId/baselines', controlsController.freezeBaseline);
router.delete('/baselines/:baselineId', controlsController.deleteBaseline);

export default router;
