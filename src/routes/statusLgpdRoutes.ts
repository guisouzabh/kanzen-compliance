import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import { listarStatusLgpd } from '../controllers/statusLgpdController';

const router = Router();

router.use(authMiddleware);

router.get('/status-lgpd', asyncHandler(listarStatusLgpd));

export default router;
