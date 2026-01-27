import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listarDocumentosEmpresa,
  criarDocumentoEmpresa,
  obterDocumentoEmpresa,
  atualizarDocumentoEmpresa,
  deletarDocumentoEmpresa,
  listarDocumentosArquivos,
  criarDocumentoArquivo,
  deletarDocumentoArquivo
} from '../controllers/documentoEmpresaController';

const router = Router();

router.use(authMiddleware);

router.get('/documentos-empresa', asyncHandler(listarDocumentosEmpresa));
router.post('/documentos-empresa', asyncHandler(criarDocumentoEmpresa));
router.get('/documentos-empresa/:id', asyncHandler(obterDocumentoEmpresa));
router.put('/documentos-empresa/:id', asyncHandler(atualizarDocumentoEmpresa));
router.delete('/documentos-empresa/:id', asyncHandler(deletarDocumentoEmpresa));

router.get('/documentos-empresa/:id/arquivos', asyncHandler(listarDocumentosArquivos));
router.post('/documentos-empresa/:id/arquivos', asyncHandler(criarDocumentoArquivo));
router.delete('/documentos-empresa/:id/arquivos/:arquivoId', asyncHandler(deletarDocumentoArquivo));

export default router;
