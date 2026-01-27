import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listarCategorias,
  criarCategoria,
  atualizarCategoria,
  deletarCategoria
} from '../controllers/categoriaDadoPessoalController';

const router = Router();

router.use(authMiddleware);

router.get('/categorias-dados-pessoais', asyncHandler(listarCategorias));
router.post('/categorias-dados-pessoais', asyncHandler(criarCategoria));
router.put('/categorias-dados-pessoais/:id', asyncHandler(atualizarCategoria));
router.delete('/categorias-dados-pessoais/:id', asyncHandler(deletarCategoria));

export default router;
