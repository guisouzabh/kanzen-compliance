import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listarEmpresaDadosStatus,
  criarEmpresaDadosStatus,
  atualizarEmpresaDadosStatus,
  deletarEmpresaDadosStatus
} from '../controllers/empresaDadosStatusController';

const router = Router();

router.use(authMiddleware);

router.get('/empresa-dados-status', asyncHandler(listarEmpresaDadosStatus));
router.post('/empresa-dados-status', asyncHandler(criarEmpresaDadosStatus));
router.put('/empresa-dados-status/:id', asyncHandler(atualizarEmpresaDadosStatus));
router.delete('/empresa-dados-status/:id', asyncHandler(deletarEmpresaDadosStatus));

export default router;
