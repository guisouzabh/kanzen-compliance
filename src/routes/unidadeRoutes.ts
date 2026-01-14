import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listarUnidades,
  criarUnidade,
  obterUnidade,
  atualizarUnidade,
  deletarUnidade
} from '../controllers/unidadeController';

const router = Router();

router.use(authMiddleware);

router.get('/unidades', asyncHandler(listarUnidades));
router.post('/unidades', asyncHandler(criarUnidade));
router.get('/unidades/:id', asyncHandler(obterUnidade));
router.put('/unidades/:id', asyncHandler(atualizarUnidade));
router.delete('/unidades/:id', asyncHandler(deletarUnidade));

export default router;
