import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listarSolicitacoesTitular,
  criarSolicitacaoTitular,
  atualizarSolicitacaoTitular,
  deletarSolicitacaoTitular
} from '../controllers/solicitacaoTitularController';

const router = Router();

router.use(authMiddleware);

router.get('/solicitacoes-titular', asyncHandler(listarSolicitacoesTitular));
router.post('/solicitacoes-titular', asyncHandler(criarSolicitacaoTitular));
router.put('/solicitacoes-titular/:id', asyncHandler(atualizarSolicitacaoTitular));
router.delete('/solicitacoes-titular/:id', asyncHandler(deletarSolicitacaoTitular));

export default router;
