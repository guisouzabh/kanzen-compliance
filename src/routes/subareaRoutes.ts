import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';
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
router.post('/subareas', requireRoles(['GESTOR']), asyncHandler(criarSubArea));
router.get('/subareas/:id', asyncHandler(obterSubArea));
router.put('/subareas/:id', requireRoles(['GESTOR']), asyncHandler(atualizarSubArea));
router.delete('/subareas/:id', requireRoles(['GESTOR']), asyncHandler(deletarSubArea));

export default router;
