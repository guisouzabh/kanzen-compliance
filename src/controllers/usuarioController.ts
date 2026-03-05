import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import {
  usuarioCreateSchema,
  usuarioTrocaSenhaSchema,
  usuarioUpdateMeSchema,
  UsuarioCreateInput,
  UsuarioTrocaSenhaInput,
  UsuarioUpdateMeInput
} from '../validation/usuarioSchema';
import { registrarUsuarioService } from '../services/authService';
import {
  atualizarMeuPerfilService,
  listarUsuariosService,
  obterMeuPerfilService,
  trocarMinhaSenhaService
} from '../services/usuarioService';
import { AppError } from '../errors/AppError';

export async function listarUsuarios(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const usuarios = await listarUsuariosService(tenantId);
  return res.json(usuarios);
}

export async function criarUsuario(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;

  const parseResult = usuarioCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: UsuarioCreateInput = parseResult.data;
  const usuario = await registrarUsuarioService({
    ...dados,
    tenant_id: tenantId
  });

  return res.status(201).json(usuario);
}

export async function obterMeuPerfil(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const usuarioId = req.usuario!.id;
  const usuario = await obterMeuPerfilService(tenantId, usuarioId);
  if (!usuario) throw new AppError('Usuário não encontrado', 404);
  return res.json(usuario);
}

export async function atualizarMeuPerfil(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const usuarioId = req.usuario!.id;

  const parseResult = usuarioUpdateMeSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: UsuarioUpdateMeInput = parseResult.data;
  const usuario = await atualizarMeuPerfilService(tenantId, usuarioId, dados);
  if (!usuario) throw new AppError('Usuário não encontrado', 404);
  return res.json(usuario);
}

export async function trocarMinhaSenha(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const usuarioId = req.usuario!.id;

  const parseResult = usuarioTrocaSenhaSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: UsuarioTrocaSenhaInput = parseResult.data;
  await trocarMinhaSenhaService(tenantId, usuarioId, dados.senha_atual, dados.nova_senha);
  return res.status(204).send();
}
