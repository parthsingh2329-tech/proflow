import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import path from 'path';
import { config } from './config/env';
import { setupSocketIO } from './sockets';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import boardRoutes from './routes/board.routes';
import taskRoutes from './routes/task.routes';
import labelRoutes from './routes/label.routes';
import milestoneRoutes from './routes/milestone.routes';
import commentRoutes from './routes/comment.routes';
import timeEntryRoutes from './routes/timeEntry.routes';
import notificationRoutes from './routes/notification.routes';
import dashboardRoutes from './routes/dashboard.routes';
import searchRoutes from './routes/search.routes';
import attachmentRoutes from './routes/attachment.routes';
import projectControlsRoutes from './routes/projectControls.routes';
import budgetRoutes from './routes/budget.routes';
import wbsRoutes from './routes/wbs.routes';
import resourceRoutes from './routes/resource.routes';
import governanceRoutes from './routes/governance.routes';
import changeManagementRoutes from './routes/changeManagement.routes';

const app = express();
const httpServer = createServer(app);

setupSocketIO(httpServer);

app.use(cors({ origin: config.CLIENT_URL }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', projectControlsRoutes);
app.use('/api/projects', budgetRoutes);
app.use('/api/projects', wbsRoutes);
app.use('/api/projects', resourceRoutes);
app.use('/api/projects', governanceRoutes);
app.use('/api/projects', changeManagementRoutes);
app.use('/api/controls', projectControlsRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/attachments', attachmentRoutes);

app.use(errorHandler);

if (process.env.VERCEL !== '1') {
  httpServer.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
  });
}

export default app;
