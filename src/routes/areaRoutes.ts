import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
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
router.post('/areas', asyncHandler(criarArea));
router.get('/areas/:id', asyncHandler(obterArea));
router.put('/areas/:id', asyncHandler(atualizarArea));
router.delete('/areas/:id', asyncHandler(deletarArea));

export default router;
