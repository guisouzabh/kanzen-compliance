import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listarTreinamentos,
  obterTreinamento,
  criarTreinamento,
  atualizarTreinamento,
  deletarTreinamento,
  obterConfig,
  salvarConfig,
  listarMateriaisPlano,
  criarMaterialPlano,
  atualizarMaterialPlano,
  deletarMaterialPlano,
  listarPerguntasQuiz,
  criarPerguntaQuiz,
  atualizarPerguntaQuiz,
  deletarPerguntaQuiz,
  listarTurmasDePlano,
  criarTurmaDePlano,
  obterTurma,
  atualizarTurma,
  deletarTurma,
  clonarTurma,
  listarParticipantes,
  adicionarParticipante,
  importarParticipantes,
  removerParticipante,
  enviarMagicLinks,
  listarMateriaisTurma,
  criarMaterialTurma,
  deletarMaterialTurma,
  relatorioDaTurma
} from '../controllers/treinamentoLgpdController';

const router = Router();
router.use(authMiddleware);

// ─── Planos de Treinamento ────────────────────────────────────────────────────
router.get('/treinamentos',       asyncHandler(listarTreinamentos));
router.post('/treinamentos',      asyncHandler(criarTreinamento));
router.get('/treinamentos/:id',   asyncHandler(obterTreinamento));
router.put('/treinamentos/:id',   asyncHandler(atualizarTreinamento));
router.delete('/treinamentos/:id', asyncHandler(deletarTreinamento));

// ─── Configuração LGPD ────────────────────────────────────────────────────────
router.get('/treinamentos/:id/config',  asyncHandler(obterConfig));
router.put('/treinamentos/:id/config',  asyncHandler(salvarConfig));

// ─── Materiais do plano ───────────────────────────────────────────────────────
router.get('/treinamentos/:id/materiais',                       asyncHandler(listarMateriaisPlano));
router.post('/treinamentos/:id/materiais',                      asyncHandler(criarMaterialPlano));
router.put('/treinamentos/:id/materiais/:materialId',           asyncHandler(atualizarMaterialPlano));
router.delete('/treinamentos/:id/materiais/:materialId',        asyncHandler(deletarMaterialPlano));

// ─── Quiz ─────────────────────────────────────────────────────────────────────
router.get('/treinamentos/:id/quiz/perguntas',                  asyncHandler(listarPerguntasQuiz));
router.post('/treinamentos/:id/quiz/perguntas',                 asyncHandler(criarPerguntaQuiz));
router.put('/treinamentos/:id/quiz/perguntas/:perguntaId',      asyncHandler(atualizarPerguntaQuiz));
router.delete('/treinamentos/:id/quiz/perguntas/:perguntaId',   asyncHandler(deletarPerguntaQuiz));

// ─── Turmas do plano ──────────────────────────────────────────────────────────
router.get('/treinamentos/:id/turmas',   asyncHandler(listarTurmasDePlano));
router.post('/treinamentos/:id/turmas',  asyncHandler(criarTurmaDePlano));

// ─── Turma (acesso direto) ────────────────────────────────────────────────────
router.get('/turmas/:turmaId',           asyncHandler(obterTurma));
router.put('/turmas/:turmaId',           asyncHandler(atualizarTurma));
router.delete('/turmas/:turmaId',        asyncHandler(deletarTurma));
router.post('/turmas/:turmaId/clonar',   asyncHandler(clonarTurma));

// ─── Participantes ────────────────────────────────────────────────────────────
router.get('/turmas/:turmaId/participantes',                          asyncHandler(listarParticipantes));
router.post('/turmas/:turmaId/participantes',                         asyncHandler(adicionarParticipante));
router.post('/turmas/:turmaId/participantes/importar',                asyncHandler(importarParticipantes));
router.delete('/turmas/:turmaId/participantes/:participanteId',       asyncHandler(removerParticipante));
router.post('/turmas/:turmaId/participantes/enviar-magic-links',      asyncHandler(enviarMagicLinks));

// ─── Materiais extras da turma ────────────────────────────────────────────────
router.get('/turmas/:turmaId/materiais',               asyncHandler(listarMateriaisTurma));
router.post('/turmas/:turmaId/materiais',              asyncHandler(criarMaterialTurma));
router.delete('/turmas/:turmaId/materiais/:materialId', asyncHandler(deletarMaterialTurma));

// ─── Relatório ────────────────────────────────────────────────────────────────
router.get('/turmas/:turmaId/relatorio',               asyncHandler(relatorioDaTurma));

export default router;
