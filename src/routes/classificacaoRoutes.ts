import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import { listarClassificacoes, criarClassificacao } from '../controllers/classificacaoController';

const router = Router();

router.use(authMiddleware);

router.get('/classificacoes', asyncHandler(listarClassificacoes));
router.post('/classificacoes', asyncHandler(criarClassificacao));

export default router;
