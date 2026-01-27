import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';

import {
  listarEmpresas,
  criarEmpresa,
  obterEmpresaPorId,
  atualizarEmpresa,
  deletarEmpresa
} from '../controllers/empresaController';

const router = Router();

router.use(authMiddleware); // tudo abaixo exige login

router.get('/empresas', asyncHandler(listarEmpresas));
router.post('/empresas', requireRoles(['GESTOR']), asyncHandler(criarEmpresa));
router.get('/empresas/:id', asyncHandler(obterEmpresaPorId));
router.put('/empresas/:id', requireRoles(['GESTOR']), asyncHandler(atualizarEmpresa));
router.delete('/empresas/:id', requireRoles(['GESTOR']), asyncHandler(deletarEmpresa));

export default router;
