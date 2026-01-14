import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listarDocumentosRegulatorios,
  criarDocumentoRegulatorio,
  obterDocumentoRegulatorio,
  atualizarDocumentoRegulatorio,
  deletarDocumentoRegulatorio
} from '../controllers/documentoRegulatorioController';

const router = Router();

router.use(authMiddleware);

router.get('/documentos-regulatorios', asyncHandler(listarDocumentosRegulatorios));
router.post('/documentos-regulatorios', asyncHandler(criarDocumentoRegulatorio));
router.get('/documentos-regulatorios/:id', asyncHandler(obterDocumentoRegulatorio));
router.put('/documentos-regulatorios/:id', asyncHandler(atualizarDocumentoRegulatorio));
router.delete('/documentos-regulatorios/:id', asyncHandler(deletarDocumentoRegulatorio));

export default router;
