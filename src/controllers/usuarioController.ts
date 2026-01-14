import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { usuarioCreateSchema, UsuarioCreateInput } from '../validation/usuarioSchema';
import { registrarUsuarioService } from '../services/authService';
import { listarUsuariosService } from '../services/usuarioService';

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
