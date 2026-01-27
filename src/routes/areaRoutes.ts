import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';
import {
  listarAreas,
  criarArea,
  obterArea,
  atualizarArea,
  deletarArea
} from '../controllers/areaController';

const router = Router();

router.use(authMiddleware);

router.get('/areas', asyncHandler(listarAreas));
router.post('/areas', requireRoles(['GESTOR']), asyncHandler(criarArea));
router.get('/areas/:id', asyncHandler(obterArea));
router.put('/areas/:id', requireRoles(['GESTOR']), asyncHandler(atualizarArea));
router.delete('/areas/:id', requireRoles(['GESTOR']), asyncHandler(deletarArea));

export default router;
