import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listarDocumentoModeloSecao,
  criarDocumentoModeloSecao,
  obterDocumentoModeloSecao,
  atualizarDocumentoModeloSecao,
  deletarDocumentoModeloSecao
} from '../controllers/documentoModeloSecaoController';

const router = Router();

router.use(authMiddleware);

router.get(
  '/documentos-regulatorios/:documentoRegulatorioId/modelo-secoes',
  asyncHandler(listarDocumentoModeloSecao)
);
router.post(
  '/documentos-regulatorios/:documentoRegulatorioId/modelo-secoes',
  asyncHandler(criarDocumentoModeloSecao)
);
router.get('/documento-modelo-secao/:id', asyncHandler(obterDocumentoModeloSecao));
router.put('/documento-modelo-secao/:id', asyncHandler(atualizarDocumentoModeloSecao));
router.delete('/documento-modelo-secao/:id', asyncHandler(deletarDocumentoModeloSecao));

export default router;
