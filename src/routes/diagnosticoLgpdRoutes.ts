import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listarDiagnosticoModelos,
  criarDiagnosticoModelo,
  atualizarDiagnosticoModelo,
  listarDiagnosticoPerguntas,
  criarDiagnosticoPergunta,
  atualizarDiagnosticoPergunta,
  deletarDiagnosticoPergunta,
  listarDiagnosticoExecucoes,
  obterDiagnosticoExecucao,
  criarDiagnosticoExecucao,
  salvarDiagnosticoRespostas,
  listarDiagnosticoRespostas,
  finalizarDiagnosticoExecucao,
  listarDiagnosticoResultadosDominio,
  gerarDiagnosticoTexto
} from '../controllers/diagnosticoLgpdController';

const router = Router();

router.use(authMiddleware);

router.get('/diagnosticos/modelos', asyncHandler(listarDiagnosticoModelos));
router.post('/diagnosticos/modelos', asyncHandler(criarDiagnosticoModelo));
router.put('/diagnosticos/modelos/:id', asyncHandler(atualizarDiagnosticoModelo));

router.get('/diagnosticos/modelos/:modeloId/perguntas', asyncHandler(listarDiagnosticoPerguntas));
router.post('/diagnosticos/modelos/:modeloId/perguntas', asyncHandler(criarDiagnosticoPergunta));
router.put('/diagnosticos/perguntas/:id', asyncHandler(atualizarDiagnosticoPergunta));
router.delete('/diagnosticos/perguntas/:id', asyncHandler(deletarDiagnosticoPergunta));

router.get('/diagnosticos/execucoes', asyncHandler(listarDiagnosticoExecucoes));
router.post('/diagnosticos/execucoes', asyncHandler(criarDiagnosticoExecucao));
router.get('/diagnosticos/execucoes/:id', asyncHandler(obterDiagnosticoExecucao));
router.get('/diagnosticos/execucoes/:id/respostas', asyncHandler(listarDiagnosticoRespostas));
router.put('/diagnosticos/execucoes/:id/respostas', asyncHandler(salvarDiagnosticoRespostas));
router.post('/diagnosticos/execucoes/:id/finalizar', asyncHandler(finalizarDiagnosticoExecucao));
router.get('/diagnosticos/execucoes/:id/resultados', asyncHandler(listarDiagnosticoResultadosDominio));
router.post('/diagnosticos/execucoes/:id/analise', asyncHandler(gerarDiagnosticoTexto));

export default router;
