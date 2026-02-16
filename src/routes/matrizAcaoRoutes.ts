import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listarMatrizAcoes,
  obterMatrizAcao,
  criarMatrizAcao,
  atualizarMatrizAcao,
  deletarMatrizAcao
} from '../controllers/matrizAcaoController';

const router = Router();

router.use(authMiddleware);

router.get('/matriz-acoes', asyncHandler(listarMatrizAcoes));
router.get('/matriz-acoes/:id', asyncHandler(obterMatrizAcao));
router.post('/matriz-acoes', asyncHandler(criarMatrizAcao));
router.put('/matriz-acoes/:id', asyncHandler(atualizarMatrizAcao));
router.delete('/matriz-acoes/:id', asyncHandler(deletarMatrizAcao));

export default router;
