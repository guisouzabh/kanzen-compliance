import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';
import {
  adicionarComiteMembro,
  atualizarComite,
  criarComite,
  deletarComite,
  listarComiteMembros,
  listarComites,
  obterComite,
  removerComiteMembro
} from '../controllers/comiteController';

const router = Router();

router.use(authMiddleware);

router.get('/comites', asyncHandler(listarComites));
router.post('/comites', requireRoles(['GESTOR']), asyncHandler(criarComite));
router.get('/comites/:id', asyncHandler(obterComite));
router.put('/comites/:id', requireRoles(['GESTOR']), asyncHandler(atualizarComite));
router.delete('/comites/:id', requireRoles(['GESTOR']), asyncHandler(deletarComite));

router.get('/comites/:id/membros', asyncHandler(listarComiteMembros));
router.post('/comites/:id/membros', requireRoles(['GESTOR']), asyncHandler(adicionarComiteMembro));
router.delete('/comites/:id/membros/:membroId', requireRoles(['GESTOR']), asyncHandler(removerComiteMembro));

export default router;
