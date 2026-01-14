import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listarSubArea2,
  criarSubArea2,
  obterSubArea2,
  atualizarSubArea2,
  deletarSubArea2
} from '../controllers/subarea2Controller';

const router = Router();

router.use(authMiddleware);

router.get('/subareas2', asyncHandler(listarSubArea2));
router.post('/subareas2', asyncHandler(criarSubArea2));
router.get('/subareas2/:id', asyncHandler(obterSubArea2));
router.put('/subareas2/:id', asyncHandler(atualizarSubArea2));
router.delete('/subareas2/:id', asyncHandler(deletarSubArea2));

export default router;
