import { Router } from 'express';
import * as resourceController from '../controllers/resource.controller';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/:projectId/resources', resourceController.getResources);
router.put('/:projectId/resources/:userId', resourceController.updateProfile);
router.patch('/:projectId/resources/:userId', resourceController.updateProfile);

router.get('/:projectId/equipment', resourceController.getEquipment);
router.post('/:projectId/equipment', resourceController.createEquipment);
router.put('/equipment/:equipmentId', resourceController.updateEquipment);
router.patch('/equipment/:equipmentId', resourceController.updateEquipment);
router.delete('/equipment/:equipmentId', resourceController.deleteEquipment);

export default router;
