import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listarSubAreas,
  criarSubArea,
  obterSubArea,
  atualizarSubArea,
  deletarSubArea
} from '../controllers/subareaController';

const router = Router();

router.use(authMiddleware);

router.get('/subareas', asyncHandler(listarSubAreas));
router.post('/subareas', asyncHandler(criarSubArea));
router.get('/subareas/:id', asyncHandler(obterSubArea));
router.put('/subareas/:id', asyncHandler(atualizarSubArea));
router.delete('/subareas/:id', asyncHandler(deletarSubArea));

export default router;
