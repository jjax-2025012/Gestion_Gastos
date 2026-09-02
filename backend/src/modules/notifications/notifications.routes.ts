import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { getNotificationsHandler } from './notifications.controller';

export const notificationsRouter = Router();
notificationsRouter.get('/', requireAuth, getNotificationsHandler);