import { Router } from 'express';
import multer, { MulterError } from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';

const uploadsRoot = path.resolve(__dirname, '..', '..', 'uploads');
const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpeg', '.jpg', '.png'];
const maxFileSize = 10 * 1024 * 1024; // 10MB

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tenantId = (req as AuthRequest).usuario?.tenantId || 'public';
    const tenantDir = path.join(uploadsRoot, 'checkins', String(tenantId));
    ensureDir(tenantDir);
    cb(null, tenantDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}-${baseName}${ext}`.toLowerCase());
  }
});

const upload = multer({
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(new AppError('Tipo de arquivo não permitido', 400));
    }
    cb(null, true);
  }
});

const router = Router();

router.use(authMiddleware);

router.post('/uploads/checkins', (req, res, next) => {
  upload.single('file')(req, res, (err: any) => {
    if (!err) return next();

    if (err instanceof MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('Arquivo excede 10MB', 400));
      }
      return next(new AppError(err.message, 400));
    }

    return next(err);
  });
}, (req: AuthRequest & { file?: Express.Multer.File }, res) => {
  if (!req.file) {
    throw new AppError('Arquivo não enviado', 400);
  }

  const relativePath = path.relative(uploadsRoot, req.file.path);
  const normalizedPath = relativePath.split(path.sep).join('/');
  const publicPath = `/uploads/${normalizedPath}`;
  const fileUrl = `${req.protocol}://${req.get('host')}${publicPath}`;

  return res.status(201).json({
    url: fileUrl,
    path: publicPath,
    filename: req.file.originalname,
    size: req.file.size
  });
});

export default router;
