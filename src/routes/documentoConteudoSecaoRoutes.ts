import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  listarDocumentoConteudoSecao,
  criarDocumentoConteudoSecao,
  obterDocumentoConteudoSecao,
  atualizarDocumentoConteudoSecao,
  deletarDocumentoConteudoSecao
} from '../controllers/documentoConteudoSecaoController';

const router = Router();

router.use(authMiddleware);

router.get(
  '/documento-conteudo/:documentoConteudoId/secoes',
  asyncHandler(listarDocumentoConteudoSecao)
);
router.post(
  '/documento-conteudo/:documentoConteudoId/secoes',
  asyncHandler(criarDocumentoConteudoSecao)
);
router.get('/documento-conteudo-secao/:id', asyncHandler(obterDocumentoConteudoSecao));
router.put('/documento-conteudo-secao/:id', asyncHandler(atualizarDocumentoConteudoSecao));
router.delete('/documento-conteudo-secao/:id', asyncHandler(deletarDocumentoConteudoSecao));

export default router;
