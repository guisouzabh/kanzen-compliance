import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listarAvaliacoesRisco,
  obterAvaliacaoPorInventario,
  listarHistorico,
  salvarAvaliacaoRisco
} from '../controllers/avaliacaoRiscoController';

const router = Router();

router.use(authMiddleware);

router.get('/avaliacao-risco', asyncHandler(listarAvaliacoesRisco));
router.get('/avaliacao-risco/inventario/:inventarioId', asyncHandler(obterAvaliacaoPorInventario));
router.get('/avaliacao-risco/:id/historico', asyncHandler(listarHistorico));
router.post('/avaliacao-risco', asyncHandler(salvarAvaliacaoRisco));

export default router;
