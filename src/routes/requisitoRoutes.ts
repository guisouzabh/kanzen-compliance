import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  atualizarRequisito,
  criarCheckin,
  criarRequisito,
  deletarRequisito,
  listarCheckins,
  listarTarefas,
  criarTarefa,
  atualizarTarefa,
  listarRequisitos,
  obterRequisito
} from '../controllers/requisitoController';
import {
  listarTarefas as listarTarefasCtrl,
  criarTarefa as criarTarefaCtrl,
  atualizarTarefa as atualizarTarefaCtrl
} from '../controllers/tarefaController';

const router = Router();

router.use(authMiddleware); // tudo abaixo exige login

router.get('/requisitos', asyncHandler(listarRequisitos));
router.post('/requisitos', asyncHandler(criarRequisito));
router.get('/requisitos/:id', asyncHandler(obterRequisito));
router.put('/requisitos/:id', asyncHandler(atualizarRequisito));
router.delete('/requisitos/:id', asyncHandler(deletarRequisito));

router.get('/requisitos/:id/checkins', asyncHandler(listarCheckins));
router.post('/requisitos/:id/checkins', asyncHandler(criarCheckin));

router.get('/requisitos/:id/tarefas', asyncHandler(listarTarefasCtrl));
router.post('/requisitos/:id/tarefas', asyncHandler(criarTarefaCtrl));
router.put('/requisitos/:id/tarefas/:tarefaId', asyncHandler(atualizarTarefaCtrl));

export default router;
