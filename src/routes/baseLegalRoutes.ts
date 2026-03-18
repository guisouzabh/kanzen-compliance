import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';
import {
  atualizarBaseLegalEmpresa,
  atualizarDmBaseLegal,
  criarBaseLegalEmpresa,
  criarDmBaseLegal,
  deletarBaseLegalEmpresa,
  deletarDmBaseLegal,
  listarBaseLegalEmpresa,
  listarDmBaseLegais
} from '../controllers/baseLegalController';

const router = Router();

router.use(authMiddleware);

router.get('/base-legais', asyncHandler(listarDmBaseLegais));
router.post('/base-legais', requireRoles(['GESTOR', 'COLABORADOR']), asyncHandler(criarDmBaseLegal));
router.put('/base-legais/:id', requireRoles(['GESTOR', 'COLABORADOR']), asyncHandler(atualizarDmBaseLegal));
router.delete('/base-legais/:id', requireRoles(['GESTOR', 'COLABORADOR']), asyncHandler(deletarDmBaseLegal));

router.get('/base-legais-empresa', asyncHandler(listarBaseLegalEmpresa));
router.post(
  '/base-legais-empresa',
  requireRoles(['GESTOR', 'COLABORADOR']),
  asyncHandler(criarBaseLegalEmpresa)
);
router.put(
  '/base-legais-empresa/:id',
  requireRoles(['GESTOR', 'COLABORADOR']),
  asyncHandler(atualizarBaseLegalEmpresa)
);
router.delete(
  '/base-legais-empresa/:id',
  requireRoles(['GESTOR', 'COLABORADOR']),
  asyncHandler(deletarBaseLegalEmpresa)
);

export default router;
