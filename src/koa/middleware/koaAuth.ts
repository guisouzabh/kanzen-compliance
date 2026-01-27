import { Context, Next } from 'koa';
import jwt from 'jsonwebtoken';
import { AppError } from '../../src/errors/AppError';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

export async function koaAuth(ctx: Context, next: Next) {
  const authHeader = ctx.headers.authorization;
  if (!authHeader) {
    throw new AppError('Token não fornecido', 401);
  }
  const [tipo, token] = authHeader.split(' ');
  if (tipo !== 'Bearer' || !token) {
    throw new AppError('Token mal formatado', 401);
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    ctx.state.usuario = {
      id: decoded.sub,
      email: decoded.email,
      nome: decoded.nome,
      tenantId: decoded.tenantId,
      empresaId: decoded.empresaId ?? null,
      areaId: decoded.areaId ?? null,
      role: decoded.role ?? undefined
    };
    await next();
  } catch (err) {
    throw new AppError('Token inválido ou expirado', 401);
  }
}
