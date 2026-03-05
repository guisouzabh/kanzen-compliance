import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { pool } from '../config/db';
import bcrypt from 'bcrypt';
import { AppError } from '../errors/AppError';
import { Usuario } from '../types/Usuario';

export async function listarUsuariosService(tenantId: number): Promise<Usuario[]> {
  return tenantQuery<Usuario>(
    tenantId,
    `
      SELECT id, nome, email, foto_url, tenant_id, empresa_id, area_id, role
        FROM usuarios
       WHERE tenant_id = ?
       ORDER BY id DESC
    `
  );
}

export async function obterMeuPerfilService(tenantId: number, usuarioId: number): Promise<Usuario | null> {
  const rows = await tenantQuery<Usuario>(
    tenantId,
    `
      SELECT id, nome, email, foto_url, tenant_id, empresa_id, area_id, role
        FROM usuarios
       WHERE tenant_id = ? AND id = ?
    `,
    [usuarioId]
  );
  return rows[0] ?? null;
}

export async function atualizarMeuPerfilService(
  tenantId: number,
  usuarioId: number,
  dados: Pick<Usuario, 'nome' | 'email' | 'foto_url'>
): Promise<Usuario | null> {
  const [duplicado] = await pool.query(
    'SELECT id FROM usuarios WHERE email = ? AND id <> ? LIMIT 1',
    [dados.email, usuarioId]
  );
  if (Array.isArray(duplicado) && duplicado.length) {
    throw new AppError('E-mail já está em uso', 409);
  }

  const result = await tenantExecute(
    tenantId,
    `
      UPDATE usuarios
         SET tenant_id = ?, nome = ?, email = ?, foto_url = ?
       WHERE tenant_id = ? AND id = ?
    `,
    [
      dados.nome,
      dados.email,
      dados.foto_url ?? null,
      tenantId,
      usuarioId
    ]
  );

  const { affectedRows } = result as any;
  if (!affectedRows) return null;
  return obterMeuPerfilService(tenantId, usuarioId);
}

export async function trocarMinhaSenhaService(
  tenantId: number,
  usuarioId: number,
  senhaAtual: string,
  novaSenha: string
): Promise<void> {
  const rows = await tenantQuery<{ id: number; senha_hash: string }>(
    tenantId,
    'SELECT id, senha_hash FROM usuarios WHERE tenant_id = ? AND id = ?',
    [usuarioId]
  );
  if (!rows.length) {
    throw new AppError('Usuário não encontrado', 404);
  }

  const senhaOk = await bcrypt.compare(senhaAtual, rows[0].senha_hash);
  if (!senhaOk) {
    throw new AppError('Senha atual inválida', 400);
  }

  const novaHash = await bcrypt.hash(novaSenha, 10);
  await tenantExecute(
    tenantId,
    'UPDATE usuarios SET tenant_id = ?, senha_hash = ? WHERE tenant_id = ? AND id = ?',
    [novaHash, tenantId, usuarioId]
  );
}
