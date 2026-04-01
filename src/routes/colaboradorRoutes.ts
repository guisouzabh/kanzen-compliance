import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listarColaboradores,
  obterColaborador,
  criarColaborador,
  atualizarColaborador,
  deletarColaborador
} from '../controllers/colaboradorController';

const router = Router();
router.use(authMiddleware);

router.get('/colaboradores',      asyncHandler(listarColaboradores));
router.post('/colaboradores',     asyncHandler(criarColaborador));
router.get('/colaboradores/:id',  asyncHandler(obterColaborador));
router.put('/colaboradores/:id',  asyncHandler(atualizarColaborador));
router.delete('/colaboradores/:id', asyncHandler(deletarColaborador));

export default router;
