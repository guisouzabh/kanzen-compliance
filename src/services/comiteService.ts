import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import { Comite, ComiteMembro, ComiteTipo } from '../types/Comite';

async function obterComiteValido(
  tenantId: number,
  comiteId: number
): Promise<{ id: number; tipo: ComiteTipo; empresa_id: number }> {
  const rows = await tenantQuery<{ id: number; tipo: ComiteTipo; empresa_id: number }>(
    tenantId,
    'SELECT id, tipo, empresa_id FROM comites WHERE tenant_id = ? AND id = ?',
    [comiteId]
  );

  if (!rows.length) {
    throw new AppError('Comitê não encontrado', 404);
  }

  return rows[0];
}

async function validarEmpresa(tenantId: number, empresaId: number): Promise<void> {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM empresas WHERE tenant_id = ? AND id = ?',
    [empresaId]
  );

  if (!rows.length) {
    throw new AppError('Empresa inválida para este tenant', 400);
  }
}

async function validarUsuario(tenantId: number, usuarioId: number): Promise<void> {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM usuarios WHERE tenant_id = ? AND id = ?',
    [usuarioId]
  );

  if (!rows.length) {
    throw new AppError('Usuário inválido para este tenant', 400);
  }
}

async function existeNomeComite(
  tenantId: number,
  empresaId: number,
  nome: string,
  excluirId?: number
): Promise<boolean> {
  const sql = excluirId
    ? 'SELECT id FROM comites WHERE tenant_id = ? AND empresa_id = ? AND nome = ? AND id <> ? LIMIT 1'
    : 'SELECT id FROM comites WHERE tenant_id = ? AND empresa_id = ? AND nome = ? LIMIT 1';

  const params = excluirId ? [empresaId, nome, excluirId] : [empresaId, nome];
  const rows = await tenantQuery<{ id: number }>(tenantId, sql, params);
  return rows.length > 0;
}

async function existeComiteDpo(
  tenantId: number,
  empresaId: number,
  excluirId?: number
): Promise<boolean> {
  const sql = excluirId
    ? "SELECT id FROM comites WHERE tenant_id = ? AND empresa_id = ? AND tipo = 'DPO' AND id <> ? LIMIT 1"
    : "SELECT id FROM comites WHERE tenant_id = ? AND empresa_id = ? AND tipo = 'DPO' LIMIT 1";
  const params = excluirId ? [empresaId, excluirId] : [empresaId];
  const rows = await tenantQuery<{ id: number }>(tenantId, sql, params);
  return rows.length > 0;
}

async function contarMembrosAtivosComite(tenantId: number, comiteId: number): Promise<number> {
  const rows = await tenantQuery<{ total: number }>(
    tenantId,
    `
      SELECT COUNT(*) AS total
        FROM comite_membros
       WHERE tenant_id = ?
         AND comite_id = ?
         AND ativo = 1
    `,
    [comiteId]
  );
  return Number(rows[0]?.total ?? 0);
}

async function obterComiteMembroPorIdService(
  tenantId: number,
  comiteId: number,
  membroId: number
): Promise<ComiteMembro | null> {
  const rows = await tenantQuery<ComiteMembro>(
    tenantId,
    `
      SELECT cm.*,
             u.nome AS usuario_nome,
             u.email AS usuario_email,
             u.role AS usuario_role
        FROM comite_membros cm
        JOIN usuarios u ON u.id = cm.usuario_id AND u.tenant_id = cm.tenant_id
       WHERE cm.tenant_id = ?
         AND cm.comite_id = ?
         AND cm.id = ?
    `,
    [comiteId, membroId]
  );

  return rows[0] ?? null;
}

export async function listarComitesService(
  tenantId: number,
  filtros: { tipo?: ComiteTipo; empresaId?: number } = {}
): Promise<Comite[]> {
  const conditions: string[] = ['c.tenant_id = ?'];
  const params: Array<string | number> = [tenantId];

  if (filtros.empresaId) {
    conditions.push('c.empresa_id = ?');
    params.push(filtros.empresaId);
  }

  if (filtros.tipo) {
    conditions.push('c.tipo = ?');
    params.push(filtros.tipo);
  }

  return tenantQuery<Comite>(
    tenantId,
    `
      SELECT c.*,
             e.nome AS empresa_nome,
             COUNT(cm.id) AS total_membros
        FROM comites c
        JOIN empresas e
          ON e.id = c.empresa_id
         AND e.tenant_id = c.tenant_id
        LEFT JOIN comite_membros cm
         ON cm.comite_id = c.id
         AND cm.tenant_id = c.tenant_id
         AND cm.ativo = 1
       WHERE ${conditions.join(' AND ')}
       GROUP BY c.id
       ORDER BY c.id DESC
    `,
    params.slice(1)
  );
}

export async function obterComitePorIdService(
  id: number,
  tenantId: number
): Promise<Comite | null> {
  const rows = await tenantQuery<Comite>(
    tenantId,
    `
      SELECT c.*,
             e.nome AS empresa_nome,
             COUNT(cm.id) AS total_membros
        FROM comites c
        JOIN empresas e
          ON e.id = c.empresa_id
         AND e.tenant_id = c.tenant_id
        LEFT JOIN comite_membros cm
          ON cm.comite_id = c.id
         AND cm.tenant_id = c.tenant_id
         AND cm.ativo = 1
       WHERE c.tenant_id = ? AND c.id = ?
       GROUP BY c.id
    `,
    [id]
  );

  return rows[0] ?? null;
}

export async function criarComiteService(dados: Comite, tenantId: number): Promise<Comite> {
  const nome = dados.nome.trim();
  const tipo = dados.tipo ?? 'COMITE';

  await validarEmpresa(tenantId, dados.empresa_id);

  if (await existeNomeComite(tenantId, dados.empresa_id, nome)) {
    throw new AppError('Já existe um comitê com este nome', 409);
  }
  if (tipo === 'DPO' && (await existeComiteDpo(tenantId, dados.empresa_id))) {
    throw new AppError('Já existe um comitê DPO para esta empresa', 409);
  }

  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO comites (tenant_id, empresa_id, nome, descricao, status, tipo)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [dados.empresa_id, nome, dados.descricao ?? null, dados.status ?? 'ATIVO', tipo]
  );

  const id = (result as any).insertId;
  const criado = await obterComitePorIdService(id, tenantId);
  return (
    criado ?? {
      id,
      empresa_id: dados.empresa_id,
      nome,
      descricao: dados.descricao ?? null,
      status: dados.status ?? 'ATIVO',
      tipo,
      total_membros: 0
    }
  );
}

export async function atualizarComiteService(
  id: number,
  dados: Comite,
  tenantId: number
): Promise<Comite | null> {
  const atual = await obterComitePorIdService(id, tenantId);
  if (!atual) return null;

  const nome = dados.nome.trim();
  const tipo = dados.tipo ?? atual.tipo ?? 'COMITE';
  const empresaId = dados.empresa_id;

  await validarEmpresa(tenantId, empresaId);

  if (await existeNomeComite(tenantId, empresaId, nome, id)) {
    throw new AppError('Já existe um comitê com este nome', 409);
  }
  if (tipo === 'DPO' && (await existeComiteDpo(tenantId, empresaId, id))) {
    throw new AppError('Já existe um comitê DPO para esta empresa', 409);
  }
  if (tipo === 'DPO') {
    const totalMembros = await contarMembrosAtivosComite(tenantId, id);
    if (totalMembros > 1) {
      throw new AppError('Comitê DPO permite no máximo 1 membro ativo', 400);
    }
  }

  const result = await tenantExecute(
    tenantId,
    `
      UPDATE comites
         SET tenant_id = ?, empresa_id = ?, nome = ?, descricao = ?, status = ?, tipo = ?
       WHERE tenant_id = ? AND id = ?
    `,
    [empresaId, nome, dados.descricao ?? null, dados.status ?? 'ATIVO', tipo, tenantId, id]
  );

  const { affectedRows } = result as any;
  if (!affectedRows) return null;
  return obterComitePorIdService(id, tenantId);
}

export async function deletarComiteService(id: number, tenantId: number): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM comites WHERE tenant_id = ? AND id = ?',
    [id]
  );

  const { affectedRows } = result as any;
  return !!affectedRows;
}

export async function listarComiteMembrosService(
  comiteId: number,
  tenantId: number
): Promise<ComiteMembro[]> {
  await obterComiteValido(tenantId, comiteId);

  return tenantQuery<ComiteMembro>(
    tenantId,
    `
      SELECT cm.*,
             u.nome AS usuario_nome,
             u.email AS usuario_email,
             u.role AS usuario_role
        FROM comite_membros cm
        JOIN usuarios u ON u.id = cm.usuario_id AND u.tenant_id = cm.tenant_id
       WHERE cm.tenant_id = ? AND cm.comite_id = ?
       ORDER BY cm.id DESC
    `,
    [comiteId]
  );
}

export async function adicionarComiteMembroService(
  comiteId: number,
  dados: Pick<ComiteMembro, 'usuario_id' | 'papel'>,
  tenantId: number
): Promise<ComiteMembro> {
  const comite = await obterComiteValido(tenantId, comiteId);
  await validarUsuario(tenantId, dados.usuario_id);

  if (comite.tipo === 'DPO') {
    const totalMembros = await contarMembrosAtivosComite(tenantId, comiteId);
    if (totalMembros >= 1) {
      throw new AppError('Comitê DPO permite apenas 1 membro ativo', 409);
    }
  }

  const duplicado = await tenantQuery<{ id: number }>(
    tenantId,
    `
      SELECT id
        FROM comite_membros
       WHERE tenant_id = ?
         AND comite_id = ?
         AND usuario_id = ?
       LIMIT 1
    `,
    [comiteId, dados.usuario_id]
  );

  if (duplicado.length) {
    throw new AppError('Usuário já é membro deste comitê', 409);
  }

  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO comite_membros (tenant_id, comite_id, usuario_id, papel, ativo)
      VALUES (?, ?, ?, ?, ?)
    `,
    [comiteId, dados.usuario_id, dados.papel ?? 'MEMBRO', 1]
  );

  const id = (result as any).insertId;
  const membro = await obterComiteMembroPorIdService(tenantId, comiteId, id);
  return (
    membro ?? {
      id,
      comite_id: comiteId,
      usuario_id: dados.usuario_id,
      papel: dados.papel ?? 'MEMBRO',
      ativo: 1
    }
  );
}

export async function removerComiteMembroService(
  comiteId: number,
  membroId: number,
  tenantId: number
): Promise<boolean> {
  await obterComiteValido(tenantId, comiteId);

  const result = await tenantExecute(
    tenantId,
    `
      DELETE FROM comite_membros
       WHERE tenant_id = ?
         AND comite_id = ?
         AND id = ?
    `,
    [comiteId, membroId]
  );

  const { affectedRows } = result as any;
  return !!affectedRows;
}
