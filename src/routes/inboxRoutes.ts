import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import { listarInbox } from '../controllers/inboxController';

const router = Router();

router.use(authMiddleware);

router.get('/inbox-notificacoes', asyncHandler(listarInbox));

export default router;
