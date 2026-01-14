import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { classificacaoSchema, ClassificacaoInput } from '../validation/classificacaoSchema';
import { listarClassificacoesService, criarClassificacaoService } from '../services/classificacaoService';

export async function listarClassificacoes(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const classificacoes = await listarClassificacoesService(tenantId);
  return res.json(classificacoes);
}

export async function criarClassificacao(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;

  const parseResult = classificacaoSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: ClassificacaoInput = parseResult.data;
  const criada = await criarClassificacaoService(dados, tenantId);
  return res.status(201).json(criada);
}
