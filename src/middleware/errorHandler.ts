import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('🔥 ERRO CAPTURADO:', err);

  // Erro previsto (AppError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      sucesso: false,
      erro: err.message
    });
  }

  // Erro inesperado
  return res.status(500).json({
    sucesso: false,
    erro: 'Erro interno do servidor'
  });
}
