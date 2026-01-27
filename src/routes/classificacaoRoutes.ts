import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';
import { listarClassificacoes, criarClassificacao } from '../controllers/classificacaoController';

const router = Router();

router.use(authMiddleware);

router.get('/classificacoes', asyncHandler(listarClassificacoes));
router.post('/classificacoes', requireRoles(['GESTOR']), asyncHandler(criarClassificacao));

export default router;
