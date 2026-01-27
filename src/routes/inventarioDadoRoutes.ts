import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listarInventario,
  criarInventario,
  atualizarInventario,
  deletarInventario
} from '../controllers/inventarioDadoController';

const router = Router();

router.use(authMiddleware);

router.get('/inventario-dados', asyncHandler(listarInventario));
router.post('/inventario-dados', asyncHandler(criarInventario));
router.put('/inventario-dados/:id', asyncHandler(atualizarInventario));
router.delete('/inventario-dados/:id', asyncHandler(deletarInventario));

export default router;
