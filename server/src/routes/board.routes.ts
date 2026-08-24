import { Router } from 'express';
import * as boardController from '../controllers/board.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Note: routes under /boards might usually be mounted on /projects/:projectId/boards in app.ts,
// but based on request, we are separating them. Assuming projectId is passed in body for create,
// or we adjust paths. Based on spec: 
// createBoard(projectId, data)
// So let's design paths assuming /api/boards is the base.

router.get('/project/:projectId', boardController.getBoards);
router.post('/project/:projectId', boardController.createBoard);
router.get('/:projectId', boardController.getBoards);

router.get('/:boardId/columns', boardController.getColumns);
router.post('/:boardId/columns', boardController.createColumn);
router.put('/columns/:columnId', boardController.updateColumn);
router.delete('/columns/:columnId', boardController.deleteColumn);
router.post('/:boardId/columns/reorder', boardController.reorderColumns);

export default router;
