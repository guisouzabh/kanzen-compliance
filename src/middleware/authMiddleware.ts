import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export interface AuthRequest extends Request {
  usuario?: {
    id: number;
    email: string;
    nome: string;
    tenantId: number;
    empresaId?: number | null;
    areaId?: number | null;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('Token não fornecido', 401);
  }

  const [tipo, token] = authHeader.split(' ');

  if (tipo !== 'Bearer' || !token) {
    throw new AppError('Token mal formatado', 401);
  }

  try {
  const decoded = jwt.verify(token, JWT_SECRET) as any;

  req.usuario = {
    id: decoded.sub,
    email: decoded.email,
    nome: decoded.nome,
    tenantId: decoded.tenantId,
    empresaId: decoded.empresaId ?? null,
    areaId: decoded.areaId ?? null
  };

    return next();
  } catch (err) {
    throw new AppError('Token inválido ou expirado', 401);
  }
}
