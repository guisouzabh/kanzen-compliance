import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import { BaseLegalEmpresa } from '../types/BaseLegalEmpresa';
import { DmBaseLegal } from '../types/DmBaseLegal';
import { BaseLegalEmpresaInput } from '../validation/baseLegalEmpresaSchema';
import { DmBaseLegalInput } from '../validation/dmBaseLegalSchema';

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

async function validarBaseLegalAtiva(tenantId: number, baseLegalId: number): Promise<void> {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM dm_base_legais WHERE tenant_id = ? AND id = ? AND ativo = 1',
    [baseLegalId]
  );
  if (!rows.length) {
    throw new AppError('Base legal inválida ou inativa para este tenant', 400);
  }
}

function normalizarFundamento(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function validarVigencia(
  dataInicio?: string | null,
  dataTermino?: string | null
): void {
  if (dataInicio && dataTermino && dataTermino < dataInicio) {
    throw new AppError('Data de término deve ser maior ou igual à data de início', 400);
  }
}

async function obterDmBaseLegalPorId(
  id: number,
  tenantId: number
): Promise<DmBaseLegal | null> {
  const rows = await tenantQuery<DmBaseLegal>(
    tenantId,
    `
      SELECT id, tenant_id, codigo, nome, ativo, created_at, updated_at
        FROM dm_base_legais
       WHERE tenant_id = ? AND id = ?
    `,
    [id]
  );

  return rows[0] ?? null;
}

async function validarDuplicidadeDmBaseLegal(
  tenantId: number,
  codigo: string,
  id?: number
): Promise<void> {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    `
      SELECT id
        FROM dm_base_legais
       WHERE tenant_id = ?
         AND codigo = ?
         ${id ? 'AND id <> ?' : ''}
       LIMIT 1
    `,
    id ? [codigo, id] : [codigo]
  );

  if (rows.length) {
    throw new AppError('Já existe uma base legal com esse código', 409);
  }
}

async function obterBaseLegalEmpresaPorId(
  id: number,
  tenantId: number
): Promise<BaseLegalEmpresa | null> {
  const rows = await tenantQuery<BaseLegalEmpresa>(
    tenantId,
    `
      SELECT ble.id,
             ble.tenant_id,
             ble.empresa_id,
             ble.base_legal_id,
             ble.status,
             ble.fundamento_juridico_empresa,
             ble.data_inicio_vigencia,
             ble.data_termino_vigencia,
             ble.deleted,
             ble.created_at,
             ble.updated_at,
             dbl.codigo AS base_legal_codigo,
             dbl.nome AS base_legal_nome,
             e.nome AS empresa_nome
        FROM base_legal_empresa ble
        JOIN dm_base_legais dbl
          ON dbl.id = ble.base_legal_id
         AND dbl.tenant_id = ble.tenant_id
        JOIN empresas e
          ON e.id = ble.empresa_id
         AND e.tenant_id = ble.tenant_id
       WHERE ble.tenant_id = ?
         AND ble.id = ?
    `,
    [id]
  );

  return rows[0] ?? null;
}

export async function listarDmBaseLegaisService(tenantId: number): Promise<DmBaseLegal[]> {
  return tenantQuery<DmBaseLegal>(
    tenantId,
    `
      SELECT id, tenant_id, codigo, nome, ativo, created_at, updated_at
        FROM dm_base_legais
       WHERE tenant_id = ?
       ORDER BY codigo ASC
    `
  );
}

export async function criarDmBaseLegalService(
  dados: DmBaseLegalInput,
  tenantId: number
): Promise<DmBaseLegal> {
  const codigo = dados.codigo.trim();
  const nome = dados.nome.trim();
  await validarDuplicidadeDmBaseLegal(tenantId, codigo);

  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO dm_base_legais (tenant_id, codigo, nome, ativo)
      VALUES (?, ?, ?, ?)
    `,
    [codigo, nome, dados.ativo === false ? 0 : 1]
  );

  const id = Number((result as any).insertId);
  const criado = await obterDmBaseLegalPorId(id, tenantId);

  return (
    criado ?? {
      id,
      codigo,
      nome,
      ativo: dados.ativo === false ? 0 : 1
    }
  );
}

export async function atualizarDmBaseLegalService(
  id: number,
  dados: DmBaseLegalInput,
  tenantId: number
): Promise<DmBaseLegal | null> {
  const atual = await obterDmBaseLegalPorId(id, tenantId);
  if (!atual) return null;

  const codigo = dados.codigo.trim();
  const nome = dados.nome.trim();
  await validarDuplicidadeDmBaseLegal(tenantId, codigo, id);

  const result = await tenantExecute(
    tenantId,
    `
      UPDATE dm_base_legais
         SET tenant_id = ?,
             codigo = ?,
             nome = ?,
             ativo = ?
       WHERE tenant_id = ?
         AND id = ?
    `,
    [codigo, nome, dados.ativo === false ? 0 : 1, tenantId, id]
  );

  const { affectedRows } = result as any;
  if (!affectedRows) return null;

  return obterDmBaseLegalPorId(id, tenantId);
}

export async function inativarDmBaseLegalService(
  id: number,
  tenantId: number
): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    `
      UPDATE dm_base_legais
         SET tenant_id = ?, ativo = 0
       WHERE tenant_id = ?
         AND id = ?
    `,
    [tenantId, id]
  );

  const { affectedRows } = result as any;
  return !!affectedRows;
}

export async function listarBaseLegalEmpresaService(
  tenantId: number,
  empresaId: number
): Promise<BaseLegalEmpresa[]> {
  await validarEmpresa(tenantId, empresaId);

  return tenantQuery<BaseLegalEmpresa>(
    tenantId,
    `
      SELECT ble.id,
             ble.tenant_id,
             ble.empresa_id,
             ble.base_legal_id,
             ble.status,
             ble.fundamento_juridico_empresa,
             ble.data_inicio_vigencia,
             ble.data_termino_vigencia,
             ble.deleted,
             ble.created_at,
             ble.updated_at,
             dbl.codigo AS base_legal_codigo,
             dbl.nome AS base_legal_nome,
             e.nome AS empresa_nome
        FROM base_legal_empresa ble
        JOIN dm_base_legais dbl
          ON dbl.id = ble.base_legal_id
         AND dbl.tenant_id = ble.tenant_id
        JOIN empresas e
          ON e.id = ble.empresa_id
         AND e.tenant_id = ble.tenant_id
       WHERE ble.tenant_id = ?
         AND ble.empresa_id = ?
         AND ble.deleted = 0
       ORDER BY dbl.codigo ASC
    `,
    [empresaId]
  );
}

export async function criarBaseLegalEmpresaService(
  dados: BaseLegalEmpresaInput,
  tenantId: number
): Promise<BaseLegalEmpresa> {
  validarVigencia(dados.data_inicio_vigencia, dados.data_termino_vigencia);
  await validarEmpresa(tenantId, dados.empresa_id);
  await validarBaseLegalAtiva(tenantId, dados.base_legal_id);

  const existente = await tenantQuery<{ id: number; deleted: number }>(
    tenantId,
    `
      SELECT id, deleted
        FROM base_legal_empresa
       WHERE tenant_id = ?
         AND empresa_id = ?
         AND base_legal_id = ?
       LIMIT 1
    `,
    [dados.empresa_id, dados.base_legal_id]
  );

  let id: number;

  if (existente.length) {
    const row = existente[0];
    if (row.deleted === 0) {
      throw new AppError('Base legal já vinculada para essa empresa', 409);
    }

    await tenantExecute(
      tenantId,
      `
        UPDATE base_legal_empresa
           SET tenant_id = ?,
               status = ?,
               fundamento_juridico_empresa = ?,
               data_inicio_vigencia = ?,
               data_termino_vigencia = ?,
               deleted = 0
         WHERE tenant_id = ?
           AND id = ?
      `,
      [
        dados.status,
        normalizarFundamento(dados.fundamento_juridico_empresa),
        dados.data_inicio_vigencia ?? null,
        dados.data_termino_vigencia ?? null,
        tenantId,
        row.id
      ]
    );

    id = row.id;
  } else {
    const result = await tenantExecute(
      tenantId,
      `
        INSERT INTO base_legal_empresa (
          tenant_id,
          empresa_id,
          base_legal_id,
          status,
          fundamento_juridico_empresa,
          data_inicio_vigencia,
          data_termino_vigencia,
          deleted
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        dados.empresa_id,
        dados.base_legal_id,
        dados.status,
        normalizarFundamento(dados.fundamento_juridico_empresa),
        dados.data_inicio_vigencia ?? null,
        dados.data_termino_vigencia ?? null,
        0
      ]
    );
    id = Number((result as any).insertId);
  }

  const criado = await obterBaseLegalEmpresaPorId(id, tenantId);

  return (
    criado ?? {
      id,
      empresa_id: dados.empresa_id,
      base_legal_id: dados.base_legal_id,
      status: dados.status,
      fundamento_juridico_empresa: normalizarFundamento(dados.fundamento_juridico_empresa),
      data_inicio_vigencia: dados.data_inicio_vigencia ?? null,
      data_termino_vigencia: dados.data_termino_vigencia ?? null,
      deleted: 0
    }
  );
}

export async function atualizarBaseLegalEmpresaService(
  id: number,
  dados: BaseLegalEmpresaInput,
  tenantId: number
): Promise<BaseLegalEmpresa | null> {
  const atual = await obterBaseLegalEmpresaPorId(id, tenantId);
  if (!atual) return null;

  validarVigencia(dados.data_inicio_vigencia, dados.data_termino_vigencia);
  await validarEmpresa(tenantId, dados.empresa_id);
  await validarBaseLegalAtiva(tenantId, dados.base_legal_id);

  const duplicado = await tenantQuery<{ id: number }>(
    tenantId,
    `
      SELECT id
        FROM base_legal_empresa
       WHERE tenant_id = ?
         AND empresa_id = ?
         AND base_legal_id = ?
         AND id <> ?
       LIMIT 1
    `,
    [dados.empresa_id, dados.base_legal_id, id]
  );

  if (duplicado.length) {
    throw new AppError('Já existe vínculo dessa base legal para a empresa', 409);
  }

  const result = await tenantExecute(
    tenantId,
    `
      UPDATE base_legal_empresa
         SET tenant_id = ?,
             empresa_id = ?,
             base_legal_id = ?,
             status = ?,
             fundamento_juridico_empresa = ?,
             data_inicio_vigencia = ?,
             data_termino_vigencia = ?
       WHERE tenant_id = ?
         AND id = ?
         AND deleted = 0
    `,
    [
      dados.empresa_id,
      dados.base_legal_id,
      dados.status,
      normalizarFundamento(dados.fundamento_juridico_empresa),
      dados.data_inicio_vigencia ?? null,
      dados.data_termino_vigencia ?? null,
      tenantId,
      id
    ]
  );

  const { affectedRows } = result as any;
  if (!affectedRows) return null;

  return obterBaseLegalEmpresaPorId(id, tenantId);
}

export async function inativarBaseLegalEmpresaService(
  id: number,
  tenantId: number
): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    `
      UPDATE base_legal_empresa
         SET tenant_id = ?,
             status = 'INATIVA',
             deleted = 1
       WHERE tenant_id = ?
         AND id = ?
         AND deleted = 0
    `,
    [tenantId, id]
  );

  const { affectedRows } = result as any;
  return !!affectedRows;
}
