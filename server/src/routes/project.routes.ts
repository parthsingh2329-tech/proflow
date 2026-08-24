import { Router } from 'express';
import * as projectController from '../controllers/project.controller';
import { authenticate } from '../middleware/auth';
import { requireProjectRole } from '../middleware/rbac';
import { validate, createProjectSchema, updateProjectSchema, addMemberSchema, updateMemberSchema } from '../validators/project';

const router = Router();

router.use(authenticate);

router.post('/', validate(createProjectSchema), projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:projectId', requireProjectRole('ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'), projectController.getProject);
router.get('/:projectId/tasks', (req, res, next) => {
  req.params.projectId = req.params.projectId;
  return require('../controllers/task.controller').getTasks(req, res, next);
});
router.get('/:projectId/boards', (req, res, next) => {
  return require('../controllers/board.controller').getBoards(req, res, next);
});
router.put('/:projectId', requireProjectRole('ADMIN', 'MANAGER'), validate(updateProjectSchema), projectController.updateProject);
router.patch('/:projectId', requireProjectRole('ADMIN', 'MANAGER'), validate(updateProjectSchema), projectController.updateProject);
router.delete('/:projectId', requireProjectRole('ADMIN'), projectController.deleteProject);

router.post('/:projectId/members', requireProjectRole('ADMIN', 'MANAGER'), validate(addMemberSchema), projectController.addMember);
router.get('/:projectId/members', requireProjectRole('ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'), projectController.getMembers);
router.put('/:projectId/members/:memberId', requireProjectRole('ADMIN', 'MANAGER'), validate(updateMemberSchema), projectController.updateMemberRole);
router.delete('/:projectId/members/:memberId', requireProjectRole('ADMIN', 'MANAGER'), projectController.removeMember);

export default router;
