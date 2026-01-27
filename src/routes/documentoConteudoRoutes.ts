import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listarDocumentoConteudo,
  criarDocumentoConteudo,
  obterDocumentoConteudo,
  atualizarDocumentoConteudo,
  deletarDocumentoConteudo
} from '../controllers/documentoConteudoController';

const router = Router();

router.use(authMiddleware);

router.get('/documentos-empresa/:documentoEmpresaId/conteudos', asyncHandler(listarDocumentoConteudo));
router.post('/documentos-empresa/:documentoEmpresaId/conteudos', asyncHandler(criarDocumentoConteudo));
router.get('/documento-conteudo/:id', asyncHandler(obterDocumentoConteudo));
router.put('/documento-conteudo/:id', asyncHandler(atualizarDocumentoConteudo));
router.delete('/documento-conteudo/:id', asyncHandler(deletarDocumentoConteudo));

export default router;
