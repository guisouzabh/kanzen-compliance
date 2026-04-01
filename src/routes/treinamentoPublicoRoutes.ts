import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  obterInfoTurmaPublica,
  identificarParticipante,
  acessarViaMagicLink,
  confirmarConclusao,
  iniciarQuiz,
  finalizarQuiz
} from '../controllers/treinamentoPublicoController';

const router = Router();

// Todas públicas — sem authMiddleware

router.get('/treinamento-publico/turma/:slug',                asyncHandler(obterInfoTurmaPublica));
router.post('/treinamento-publico/turma/:slug/identificar',   asyncHandler(identificarParticipante));
router.get('/treinamento-publico/magic/:token',               asyncHandler(acessarViaMagicLink));
router.post('/treinamento-publico/confirmar-conclusao',       asyncHandler(confirmarConclusao));
router.post('/treinamento-publico/quiz/iniciar',              asyncHandler(iniciarQuiz));
router.post('/treinamento-publico/quiz/finalizar',            asyncHandler(finalizarQuiz));

export default router;
