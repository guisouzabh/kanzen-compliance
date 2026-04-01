import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listarPlanos,
  obterPlano,
  criarPlano,
  atualizarPlano,
  deletarPlano,
  listarAcoesDePlano,
  criarAcaoEmPlano,
  atualizarAcaoEmPlano,
  deletarAcaoEmPlano,
  listarTurmas,
  obterTurma,
  criarTurma,
  atualizarTurma,
  deletarTurma,
  listarAuditoriaItens,
  obterAuditoriaItem,
  criarAuditoriaItem,
  atualizarAuditoriaItem,
  deletarAuditoriaItem
} from '../controllers/planoController';

const router = Router();
router.use(authMiddleware);

// ─── Planos (CRUD) ────────────────────────────────────────────────────────────
router.get('/planos',     asyncHandler(listarPlanos));
router.post('/planos',    asyncHandler(criarPlano));
router.get('/planos/:id', asyncHandler(obterPlano));
router.put('/planos/:id', asyncHandler(atualizarPlano));
router.delete('/planos/:id', asyncHandler(deletarPlano));

// ─── Ações (Plano de Ações) ───────────────────────────────────────────────────
router.get('/planos/:planoId/acoes',              asyncHandler(listarAcoesDePlano));
router.post('/planos/:planoId/acoes',             asyncHandler(criarAcaoEmPlano));
router.put('/planos/:planoId/acoes/:itemId',      asyncHandler(atualizarAcaoEmPlano));
router.delete('/planos/:planoId/acoes/:itemId',   asyncHandler(deletarAcaoEmPlano));

// ─── Turmas (Plano de Treinamento) ────────────────────────────────────────────
router.get('/planos/:planoId/turmas',             asyncHandler(listarTurmas));
router.post('/planos/:planoId/turmas',            asyncHandler(criarTurma));
router.get('/planos/:planoId/turmas/:itemId',     asyncHandler(obterTurma));
router.put('/planos/:planoId/turmas/:itemId',     asyncHandler(atualizarTurma));
router.delete('/planos/:planoId/turmas/:itemId',  asyncHandler(deletarTurma));

// ─── Itens de Auditoria (Plano de Auditoria) ─────────────────────────────────
router.get('/planos/:planoId/auditoria-itens',            asyncHandler(listarAuditoriaItens));
router.post('/planos/:planoId/auditoria-itens',           asyncHandler(criarAuditoriaItem));
router.get('/planos/:planoId/auditoria-itens/:itemId',    asyncHandler(obterAuditoriaItem));
router.put('/planos/:planoId/auditoria-itens/:itemId',    asyncHandler(atualizarAuditoriaItem));
router.delete('/planos/:planoId/auditoria-itens/:itemId', asyncHandler(deletarAuditoriaItem));

export default router;
