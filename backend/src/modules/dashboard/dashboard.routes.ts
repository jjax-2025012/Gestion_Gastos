import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { getDashboardMetricsHandler } from './dashboard.controller';

export const dashboardRouter = Router();
dashboardRouter.get('/metrics', requireAuth, getDashboardMetricsHandler);