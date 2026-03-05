import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';
import {
  listarDiagnosticoModelosService,
  criarDiagnosticoModeloService,
  atualizarDiagnosticoModeloService,
  listarDiagnosticoPerguntasService,
  criarDiagnosticoPerguntaService,
  atualizarDiagnosticoPerguntaService,
  deletarDiagnosticoPerguntaService,
  listarDiagnosticoExecucoesService,
  criarDiagnosticoExecucaoService,
  obterDiagnosticoExecucaoPorIdService,
  salvarDiagnosticoRespostasService,
  finalizarDiagnosticoExecucaoService,
  listarDiagnosticoResultadosDominioService,
  listarDiagnosticoResultadosMacroService,
  listarDiagnosticoRespostasService,
  gerarDiagnosticoTextoService,
  listarDmEscopoService,
  criarDiagnosticoAcoesService
} from '../services/diagnosticoLgpdService';
import {
  diagnosticoModeloSchema,
  diagnosticoPerguntaSchema,
  diagnosticoExecucaoSchema,
  diagnosticoRespostasSchema,
  diagnosticoAcoesSchema,
  DiagnosticoModeloInput,
  DiagnosticoPerguntaInput,
  DiagnosticoExecucaoInput,
  DiagnosticoRespostasInput,
  DiagnosticoAcoesInput
} from '../validation/diagnosticoLgpdSchema';

export async function listarDiagnosticoModelos(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const dados = await listarDiagnosticoModelosService(tenantId);
  return res.json(dados);
}

export async function listarDmEscopos(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const dados = await listarDmEscopoService(tenantId);
  return res.json(dados);
}

export async function criarDiagnosticoModelo(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const parseResult = diagnosticoModeloSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }
  const dados: DiagnosticoModeloInput = parseResult.data;
  const criado = await criarDiagnosticoModeloService(dados, tenantId);
  return res.status(201).json(criado);
}

export async function atualizarDiagnosticoModelo(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);

  const parseResult = diagnosticoModeloSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }
  const dados: DiagnosticoModeloInput = parseResult.data;
  const atualizado = await atualizarDiagnosticoModeloService(id, dados, tenantId);
  if (!atualizado) throw new AppError('ID inválido', 404);
  return res.json(atualizado);
}

export async function listarDiagnosticoPerguntas(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const modeloId = Number(req.params.modeloId);
  if (Number.isNaN(modeloId)) throw new AppError('modeloId inválido', 400);
  const dados = await listarDiagnosticoPerguntasService(tenantId, modeloId);
  return res.json(dados);
}

export async function criarDiagnosticoPergunta(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const modeloId = Number(req.params.modeloId);
  if (Number.isNaN(modeloId)) throw new AppError('modeloId inválido', 400);

  const parseResult = diagnosticoPerguntaSchema.safeParse({
    ...req.body,
    modelo_id: modeloId
  });
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }
  const dados: DiagnosticoPerguntaInput = parseResult.data;
  const criada = await criarDiagnosticoPerguntaService(dados, tenantId);
  return res.status(201).json(criada);
}

export async function atualizarDiagnosticoPergunta(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);

  const parseResult = diagnosticoPerguntaSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }
  const dados: DiagnosticoPerguntaInput = parseResult.data;
  const atualizado = await atualizarDiagnosticoPerguntaService(id, dados, tenantId);
  if (!atualizado) throw new AppError('ID inválido', 404);
  return res.json(atualizado);
}

export async function deletarDiagnosticoPergunta(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);
  const ok = await deletarDiagnosticoPerguntaService(id, tenantId);
  if (!ok) throw new AppError('ID inválido', 404);
  return res.status(204).send();
}

export async function listarDiagnosticoExecucoes(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const empresaId = req.query.empresa_id ? Number(req.query.empresa_id) : undefined;
  if (req.query.empresa_id && Number.isNaN(empresaId)) {
    throw new AppError('empresa_id inválido', 400);
  }
  const dados = await listarDiagnosticoExecucoesService(tenantId, empresaId);
  return res.json(dados);
}

export async function obterDiagnosticoExecucao(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);
  const execucao = await obterDiagnosticoExecucaoPorIdService(id, tenantId);
  if (!execucao) throw new AppError('ID inválido', 404);
  return res.json(execucao);
}

export async function criarDiagnosticoExecucao(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const usuarioId = req.usuario?.id;
  const parseResult = diagnosticoExecucaoSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }
  const dados: DiagnosticoExecucaoInput = parseResult.data;
  const criado = await criarDiagnosticoExecucaoService(dados, tenantId, usuarioId);
  return res.status(201).json(criado);
}

export async function salvarDiagnosticoRespostas(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);

  const parseResult = diagnosticoRespostasSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }
  const dados: DiagnosticoRespostasInput = parseResult.data;
  await salvarDiagnosticoRespostasService(id, dados.respostas, tenantId);
  return res.status(204).send();
}

export async function listarDiagnosticoRespostas(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);
  const dados = await listarDiagnosticoRespostasService(id, tenantId);
  return res.json(dados);
}

export async function finalizarDiagnosticoExecucao(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const usuarioId = req.usuario?.id;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);
  const resultado = await finalizarDiagnosticoExecucaoService(id, tenantId, usuarioId);
  return res.json(resultado);
}

export async function listarDiagnosticoResultadosDominio(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);
  const dados = await listarDiagnosticoResultadosDominioService(id, tenantId);
  return res.json(dados);
}

export async function listarDiagnosticoResultadosMacro(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);
  const dados = await listarDiagnosticoResultadosMacroService(id, tenantId);
  return res.json(dados);
}

export async function gerarDiagnosticoTexto(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);
  const resultado = await gerarDiagnosticoTextoService(id, tenantId);
  return res.json(resultado);
}

export async function criarDiagnosticoAcoes(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);

  const parseResult = diagnosticoAcoesSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }
  const dados: DiagnosticoAcoesInput = parseResult.data;
  const resultado = await criarDiagnosticoAcoesService(id, tenantId, dados.acoes);
  return res.json(resultado);
}
