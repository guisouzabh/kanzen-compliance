import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import { buscarCnaes } from '../controllers/cnaeController';

const router = Router();

router.use(authMiddleware);
router.get('/cnaes/busca', asyncHandler(buscarCnaes));

export default router;
