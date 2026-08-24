import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import * as commentController from '../controllers/comment.controller';
import * as timeEntryController from '../controllers/timeEntry.controller';
import { authenticate } from '../middleware/auth';
import { validate, createTaskSchema, updateTaskSchema, moveTaskSchema } from '../validators/task';
import { validate as validateQuery, queryParamsSchema, createCommentSchema, createTimeEntrySchema } from '../validators/common';

const router = Router();

router.use(authenticate);

// Tasks query by project
router.get('/project/:projectId', validateQuery(queryParamsSchema), taskController.getTasks);
router.get('/', validateQuery(queryParamsSchema), (req, res, next) => {
  if (req.query.projectId) {
    req.params.projectId = req.query.projectId as string;
    return taskController.getTasks(req, res, next);
  }
  taskController.getTasks(req, res, next);
});

// Task CRUD
router.post('/', validate(createTaskSchema), taskController.createTask);
router.get('/:taskId', taskController.getTask);
router.put('/:taskId', validate(updateTaskSchema), taskController.updateTask);
router.patch('/:taskId', validate(updateTaskSchema), taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);

// Task Move
router.post('/:taskId/move', validate(moveTaskSchema), taskController.moveTask);
router.patch('/:taskId/move', validate(moveTaskSchema), taskController.moveTask);

// Subtasks
router.get('/:taskId/subtasks', taskController.getSubtasks);
router.post('/:taskId/subtasks', taskController.createSubtask);

// Labels
router.post('/:taskId/labels/:labelId', taskController.addLabel);
router.delete('/:taskId/labels/:labelId', taskController.removeLabel);

// Dependencies
router.post('/:taskId/dependencies', taskController.addDependency);
router.delete('/:taskId/dependencies/:dependencyId', taskController.removeDependency);
router.delete('/dependencies/:dependencyId', taskController.removeDependency);

// Comments on task
router.get('/:taskId/comments', commentController.getComments);
router.post('/:taskId/comments', validate(createCommentSchema), commentController.createComment);

// Time entries on task
router.get('/:taskId/time-entries', timeEntryController.getTimeEntries);
router.post('/:taskId/time-entries', validate(createTimeEntrySchema), timeEntryController.createTimeEntry);

export default router;
