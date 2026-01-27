import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';
import { listarUsuarios, criarUsuario } from '../controllers/usuarioController';

const router = Router();

router.use(authMiddleware);

router.get('/usuarios', asyncHandler(listarUsuarios));
router.post('/usuarios', requireRoles(['GESTOR']), asyncHandler(criarUsuario));

export default router;
