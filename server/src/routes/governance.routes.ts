import { Router } from 'express';
import * as governanceController from '../controllers/governance.controller';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/:projectId/gates', governanceController.getGates);
router.post('/:projectId/gates', governanceController.createGate);
router.put('/gates/:gateId', governanceController.updateGate);
router.patch('/gates/:gateId', governanceController.updateGate);
router.post('/gates/:gateId/signoff', governanceController.signOffGate);
router.delete('/gates/:gateId', governanceController.deleteGate);

router.patch('/gates/criteria/:criteriaId', governanceController.toggleCriteria);

export default router;
