import { Request, Response } from 'express';
import { registrarUsuarioService, loginService } from '../services/authService';
import { asyncHandler } from '../utils/asyncHandler';

export const registrarUsuario = asyncHandler(async (req: Request, res: Response) => {
  const { nome, email, senha, foto_url, tenant_id, empresa_id, area_id } = req.body;

  if (!nome || !email || !senha || !tenant_id) {
    return res.status(400).json({ erro: 'nome, email, senha e tenantId são obrigatórios' });
  }

  const usuario = await registrarUsuarioService({
    nome,
    email,
    senha,
    foto_url,
    tenant_id,
    empresa_id,
    area_id
  });
  return res.status(201).json(usuario);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'email e senha são obrigatórios' });
  }

  const { token } = await loginService(email, senha);

  return res.json({ token });
});
