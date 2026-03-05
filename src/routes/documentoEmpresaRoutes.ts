import { Router } from 'express';
import fs from 'fs';
import multer, { MulterError } from 'multer';
import path from 'path';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../errors/AppError';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import {
  listarDocumentosEmpresa,
  criarDocumentoEmpresa,
  obterDocumentoEmpresa,
  atualizarDocumentoEmpresa,
  deletarDocumentoEmpresa,
  listarDocumentosArquivos,
  criarDocumentoArquivo,
  deletarDocumentoArquivo,
  uploadDocumentoRegulatorioWord,
  obterOnlyofficeEditConfig,
  downloadArquivoOnlyoffice,
  callbackOnlyofficeDocumento
} from '../controllers/documentoEmpresaController';

const router = Router();
const arquivosRoot = path.resolve(__dirname, '..', '..', 'arquivos-s3');
const maxWordFileSize = 10 * 1024 * 1024; // 10MB

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

const wordStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const tenantId = (req as AuthRequest).usuario?.tenantId || 'public';
    const documentoEmpresaId = Number(req.params.id) || 'documento';
    const targetDir = path.join(
      arquivosRoot,
      'documentos-regulatorios',
      String(tenantId),
      String(documentoEmpresaId)
    );
    ensureDir(targetDir);
    cb(null, targetDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}-${baseName}${ext}`);
  }
});

const uploadWord = multer({
  storage: wordStorage,
  limits: { fileSize: maxWordFileSize },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.doc', '.docx'].includes(ext)) {
      return cb(new AppError('Apenas arquivos Word (.doc, .docx) são permitidos', 400));
    }
    cb(null, true);
  }
});

router.get(
  '/onlyoffice/documentos-empresa/:id/arquivos/:arquivoId/download',
  asyncHandler(downloadArquivoOnlyoffice)
);
router.post(
  '/onlyoffice/documentos-empresa/:id/arquivos/:arquivoId/callback',
  asyncHandler(callbackOnlyofficeDocumento)
);

router.use(authMiddleware);

router.get('/documentos-empresa', asyncHandler(listarDocumentosEmpresa));
router.post('/documentos-empresa', asyncHandler(criarDocumentoEmpresa));
router.get('/documentos-empresa/:id', asyncHandler(obterDocumentoEmpresa));
router.put('/documentos-empresa/:id', asyncHandler(atualizarDocumentoEmpresa));
router.delete('/documentos-empresa/:id', asyncHandler(deletarDocumentoEmpresa));

router.get('/documentos-empresa/:id/arquivos', asyncHandler(listarDocumentosArquivos));
router.get(
  '/documentos-empresa/:id/arquivos/:arquivoId/onlyoffice-config',
  asyncHandler(obterOnlyofficeEditConfig)
);
router.post('/documentos-empresa/:id/arquivos', asyncHandler(criarDocumentoArquivo));
router.post(
  '/documentos-empresa/:id/arquivos/upload-word',
  (req, res, next) => {
    uploadWord.single('file')(req, res, (err: any) => {
      if (!err) return next();

      if (err instanceof MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('Arquivo excede 10MB', 400));
        }
        return next(new AppError(err.message, 400));
      }

      return next(err);
    });
  },
  asyncHandler(uploadDocumentoRegulatorioWord)
);
router.delete('/documentos-empresa/:id/arquivos/:arquivoId', asyncHandler(deletarDocumentoArquivo));

export default router;
