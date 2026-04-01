import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import { Colaborador } from '../types/Colaborador';
import { ColaboradorInput } from '../validation/colaboradorSchema';

export async function listarColaboradoresService(
  tenantId: number,
  empresaId?: number
): Promise<Colaborador[]> {
  const conditions = ['c.tenant_id = ?'];
  const params: any[] = [];

  if (empresaId) {
    conditions.push('c.empresa_id = ?');
    params.push(empresaId);
  }

  return tenantQuery<Colaborador>(
    tenantId,
    `SELECT c.*, e.nome AS empresa_nome
       FROM colaboradores c
       JOIN empresas e ON e.id = c.empresa_id AND e.tenant_id = c.tenant_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY c.nome ASC`,
    params
  );
}

export async function obterColaboradorPorIdService(
  id: number,
  tenantId: number
): Promise<Colaborador | null> {
  const rows = await tenantQuery<Colaborador>(
    tenantId,
    `SELECT c.*, e.nome AS empresa_nome
       FROM colaboradores c
       JOIN empresas e ON e.id = c.empresa_id AND e.tenant_id = c.tenant_id
      WHERE c.tenant_id = ? AND c.id = ?`,
    [id]
  );
  return rows[0] ?? null;
}

export async function criarColaboradorService(
  dados: ColaboradorInput,
  tenantId: number
): Promise<Colaborador> {
  const result = await tenantExecute(
    tenantId,
    `INSERT INTO colaboradores
       (tenant_id, empresa_id, usuario_id, nome, email, cpf, data_nascimento, identificador, cargo, ativo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      dados.empresa_id,
      dados.usuario_id ?? null,
      dados.nome,
      dados.email,
      dados.cpf ?? null,
      dados.data_nascimento ?? null,
      dados.identificador ?? null,
      dados.cargo ?? null,
      dados.ativo ?? 1
    ]
  );

  const id = (result as any).insertId;
  const criado = await obterColaboradorPorIdService(id, tenantId);
  return criado!;
}

export async function atualizarColaboradorService(
  id: number,
  dados: ColaboradorInput,
  tenantId: number
): Promise<Colaborador | null> {
  const result = await tenantExecute(
    tenantId,
    `UPDATE colaboradores
        SET empresa_id = ?, usuario_id = ?, nome = ?, email = ?,
            cpf = ?, data_nascimento = ?, identificador = ?, cargo = ?, ativo = ?
      WHERE tenant_id = ? AND id = ?`,
    [
      dados.empresa_id,
      dados.usuario_id ?? null,
      dados.nome,
      dados.email,
      dados.cpf ?? null,
      dados.data_nascimento ?? null,
      dados.identificador ?? null,
      dados.cargo ?? null,
      dados.ativo ?? 1,
      id
    ]
  );

  if (!(result as any).affectedRows) return null;
  return obterColaboradorPorIdService(id, tenantId);
}

export async function deletarColaboradorService(
  id: number,
  tenantId: number
): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM colaboradores WHERE tenant_id = ? AND id = ?',
    [id]
  );
  return (result as any).affectedRows > 0;
}

/**
 * Cria ou atualiza colaborador (upsert por tenant_id + empresa_id + email).
 * Retorna { id, criado }
 */
export async function upsertColaboradorService(
  tenantId: number,
  empresaId: number,
  dados: {
    nome: string;
    email: string;
    identificador?: string | null;
    data_nascimento?: string | null;
    cargo?: string | null;
  }
): Promise<{ id: number; criado: boolean }> {
  const existente = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM colaboradores WHERE tenant_id = ? AND empresa_id = ? AND email = ?',
    [empresaId, dados.email]
  );

  if (existente.length) {
    await tenantExecute(
      tenantId,
      `UPDATE colaboradores
          SET nome = ?, identificador = ?, data_nascimento = ?, cargo = ?
        WHERE tenant_id = ? AND id = ?`,
      [
        dados.nome,
        dados.identificador ?? null,
        dados.data_nascimento ?? null,
        dados.cargo ?? null,
        existente[0].id
      ]
    );
    return { id: existente[0].id, criado: false };
  }

  const result = await tenantExecute(
    tenantId,
    `INSERT INTO colaboradores (tenant_id, empresa_id, nome, email, identificador, data_nascimento, cargo)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      empresaId,
      dados.nome,
      dados.email,
      dados.identificador ?? null,
      dados.data_nascimento ?? null,
      dados.cargo ?? null
    ]
  );

  return { id: (result as any).insertId, criado: true };
}
