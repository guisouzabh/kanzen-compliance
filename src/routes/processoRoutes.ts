import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listarProcessos,
  criarProcesso,
  atualizarProcesso,
  deletarProcesso
} from '../controllers/processoController';

const router = Router();

router.use(authMiddleware);

router.get('/processos', asyncHandler(listarProcessos));
router.post('/processos', asyncHandler(criarProcesso));
router.put('/processos/:id', asyncHandler(atualizarProcesso));
router.delete('/processos/:id', asyncHandler(deletarProcesso));

export default router;
