import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';
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
router.post('/unidades', requireRoles(['GESTOR']), asyncHandler(criarUnidade));
router.get('/unidades/:id', asyncHandler(obterUnidade));
router.put('/unidades/:id', requireRoles(['GESTOR']), asyncHandler(atualizarUnidade));
router.delete('/unidades/:id', requireRoles(['GESTOR']), asyncHandler(deletarUnidade));

export default router;
