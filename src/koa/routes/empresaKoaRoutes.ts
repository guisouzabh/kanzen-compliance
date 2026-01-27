import Router from '@koa/router';
import { listarEmpresasService, criarEmpresaService } from '../../src/services/empresaService';
import { koaAuth } from '../middleware/koaAuth';
import { koaErrorHandler } from '../middleware/koaErrorHandler';
import bodyParser from 'koa-bodyparser';
import { AppError } from '../../src/errors/AppError';
import { empresaSchema, EmpresaInput } from '../../src/validation/empresaSchema';

const router = new Router({ prefix: '/api/v1/koa' });

router.use(bodyParser());
router.use(koaErrorHandler);
router.use(koaAuth);

router.get('/empresas', async (ctx) => {
  const tenantId = ctx.state.usuario?.tenantId;
  if (!tenantId) throw new AppError('Tenant não encontrado no token', 401);
  const empresas = await listarEmpresasService(tenantId);
  ctx.body = empresas;
});

router.post('/empresas', async (ctx) => {
  const tenantId = ctx.state.usuario?.tenantId;
  if (!tenantId) throw new AppError('Tenant não encontrado no token', 401);

  const parseResult = empresaSchema.safeParse(ctx.request.body);
  if (!parseResult.success) {
    ctx.status = 400;
    ctx.body = { erro: 'Dados inválidos', detalhes: parseResult.error.issues };
    return;
  }

  const dados: EmpresaInput = parseResult.data;
  const criada = await criarEmpresaService(dados, tenantId);
  ctx.status = 201;
  ctx.body = criada;
});

export default router;
