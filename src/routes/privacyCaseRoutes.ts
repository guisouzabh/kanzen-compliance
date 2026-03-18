import { Router } from 'express';
import fs from 'fs';
import multer, { MulterError } from 'multer';
import path from 'path';
import { asyncHandler } from '../utils/asyncHandler';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { requireRoles } from '../middleware/roleMiddleware';
import { AppError } from '../errors/AppError';
import {
  adicionarTimelinePrivacyCase,
  atribuirPrivacyCase,
  atualizarPrivacyCase,
  criarPrivacyCase,
  criarPrivacyCasePublico,
  deletarAnexoPrivacyCase,
  finalizarDecisaoComunicacaoPrivacyCase,
  listarAprovacoesDecisaoPrivacyCase,
  listarAnexosPrivacyCase,
  listarPrivacyCases,
  listarTimelinePrivacyCase,
  obterPrivacyCase,
  registrarAprovacaoDecisaoPrivacyCase,
  solicitarDecisaoComunicacaoPrivacyCase,
  uploadAnexoPrivacyCase
} from '../controllers/privacyCaseController';

const router = Router();
const arquivosRoot = path.resolve(__dirname, '..', '..', 'arquivos-s3');
const allowedExtensions = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.jpeg',
  '.jpg',
  '.png',
  '.txt',
  '.csv'
];
const maxFileSize = 20 * 1024 * 1024; // 20MB

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

const anexoStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const tenantId = (req as AuthRequest).usuario?.tenantId || 'public';
    const privacyCaseId = Number(req.params.id) || 'caso';
    const targetDir = path.join(arquivosRoot, 'privacy-cases', String(tenantId), String(privacyCaseId));
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

const uploadAnexo = multer({
  storage: anexoStorage,
  limits: { fileSize: maxFileSize },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(new AppError('Tipo de arquivo não permitido', 400));
    }
    cb(null, true);
  }
});

router.post('/public/privacy-cases', asyncHandler(criarPrivacyCasePublico));

router.use(authMiddleware);

router.get('/privacy-cases', asyncHandler(listarPrivacyCases));
router.get('/privacy-cases/:id', asyncHandler(obterPrivacyCase));
router.post('/privacy-cases', requireRoles(['GESTOR', 'COLABORADOR']), asyncHandler(criarPrivacyCase));
router.put('/privacy-cases/:id', requireRoles(['GESTOR', 'COLABORADOR']), asyncHandler(atualizarPrivacyCase));
router.patch('/privacy-cases/:id/assign', requireRoles(['GESTOR', 'COLABORADOR']), asyncHandler(atribuirPrivacyCase));
router.post(
  '/privacy-cases/:id/communication-decision/request',
  requireRoles(['GESTOR', 'COLABORADOR']),
  asyncHandler(solicitarDecisaoComunicacaoPrivacyCase)
);
router.get('/privacy-cases/:id/communication-decision/approvals', asyncHandler(listarAprovacoesDecisaoPrivacyCase));
router.post(
  '/privacy-cases/:id/communication-decision/approvals',
  asyncHandler(registrarAprovacaoDecisaoPrivacyCase)
);
router.post(
  '/privacy-cases/:id/communication-decision/finalize',
  requireRoles(['GESTOR', 'COLABORADOR']),
  asyncHandler(finalizarDecisaoComunicacaoPrivacyCase)
);

router.get('/privacy-cases/:id/timeline', asyncHandler(listarTimelinePrivacyCase));
router.post(
  '/privacy-cases/:id/timeline',
  requireRoles(['GESTOR', 'COLABORADOR']),
  asyncHandler(adicionarTimelinePrivacyCase)
);

router.get('/privacy-cases/:id/anexos', asyncHandler(listarAnexosPrivacyCase));
router.post(
  '/privacy-cases/:id/anexos/upload',
  requireRoles(['GESTOR', 'COLABORADOR']),
  (req, res, next) => {
    uploadAnexo.single('file')(req, res, (err: unknown) => {
      if (!err) return next();

      if (err instanceof MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('Arquivo excede 20MB', 400));
        }
        return next(new AppError(err.message, 400));
      }

      return next(err);
    });
  },
  asyncHandler(uploadAnexoPrivacyCase)
);

router.delete(
  '/privacy-cases/:id/anexos/:anexoId',
  requireRoles(['GESTOR', 'COLABORADOR']),
  asyncHandler(deletarAnexoPrivacyCase)
);

export default router;
