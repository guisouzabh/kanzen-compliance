import { NextFunction, Response } from 'express';
import { AuthRequest } from './authMiddleware';
import { AppError } from '../errors/AppError';

export type UserRole = 'GESTOR' | 'COLABORADOR' | 'USUARIO_TAREFA';

export function requireRoles(roles: UserRole[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    const role = req.usuario?.role;
    if (!role || !roles.includes(role)) {
      throw new AppError('Acesso negado', 403);
    }
    return next();
  };
}
