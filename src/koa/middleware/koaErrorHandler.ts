import { Context, Next } from 'koa';
import { AppError } from '../../src/errors/AppError';

export async function koaErrorHandler(ctx: Context, next: Next) {
  try {
    await next();
  } catch (err: any) {
    console.error('🔥 KOA ERROR:', err);
    if (err instanceof AppError) {
      ctx.status = err.statusCode;
      ctx.body = { sucesso: false, erro: err.message };
      return;
    }
    ctx.status = 500;
    ctx.body = { sucesso: false, erro: 'Erro interno do servidor' };
  }
}
