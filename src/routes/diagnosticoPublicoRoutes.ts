import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  listarPerguntasPublico,
  calcularResultadoPublico
} from '../controllers/diagnosticoPublicoController';

const router = Router();

router.get('/public/diagnostico/perguntas', asyncHandler(listarPerguntasPublico));
router.post('/public/diagnostico/calcular', asyncHandler(calcularResultadoPublico));

export default router;
