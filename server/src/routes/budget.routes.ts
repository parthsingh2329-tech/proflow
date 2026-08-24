import { Router } from 'express';
import * as budgetController from '../controllers/budget.controller';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/:projectId/budget', budgetController.getBudget);
router.put('/:projectId/budget', budgetController.updateBudget);
router.patch('/:projectId/budget', budgetController.updateBudget);

router.post('/:projectId/budget/items', budgetController.addCostItem);
router.put('/budget/items/:costItemId', budgetController.updateCostItem);
router.patch('/budget/items/:costItemId', budgetController.updateCostItem);
router.delete('/budget/items/:costItemId', budgetController.deleteCostItem);

export default router;
