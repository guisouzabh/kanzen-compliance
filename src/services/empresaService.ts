import { CnaeSecundario, Empresa } from '../types/Empresa';
import { logChange } from './auditService';
import { tenantQuery, tenantExecute } from '../db/tenantDb'

type EmpresaRow = Omit<Empresa, 'cnaes_secundarios'> & {
  cnaes_secundarios_json?: string | null;
};

function parseCnaesSecundarios(value: unknown): CnaeSecundario[] {
  if (!value) return [];

  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is CnaeSecundario =>
          Boolean(item) &&
          typeof item === 'object' &&
          typeof (item as CnaeSecundario).codigo === 'string' &&
          typeof (item as CnaeSecundario).descricao === 'string'
      )
      .map((item) => ({
        codigo: item.codigo.trim(),
        descricao: item.descricao.trim()
      }))
      .filter((item) => item.codigo.length > 0 && item.descricao.length > 0);
  } catch {
    return [];
  }
}

function mapEmpresaRow(row: EmpresaRow): Empresa {
  const { cnaes_secundarios_json, ...rest } = row;
  return {
    ...rest,
    cnaes_secundarios: parseCnaesSecundarios(cnaes_secundarios_json)
  };
}

// Lista todas as empresas do tenant
export async function listarEmpresasService(tenantId: number): Promise<Empresa[]> {
  const rows = await tenantQuery<EmpresaRow>(
    tenantId,
    'SELECT * FROM empresas WHERE tenant_id = ?'
  );
  return rows.map(mapEmpresaRow);
}

// Cria empresa para um tenant
export async function criarEmpresaService(
  dados: Empresa,
  tenantId: number
): Promise<Empresa> {
  const {
    nome,
    cnpj,
    matriz_ou_filial,
    razao_social,
    ramo_atuacao,
    cnae_principal_codigo,
    cnae_principal_descricao,
    cnaes_secundarios,
    cep,
    endereco,
    cidade,
    estado,
    logo_url,
    parametro_maturidade,
    termometro_sancoes_id
  } = dados;
  const maturidade = parametro_maturidade ?? 0;
  const termometro = termometro_sancoes_id ?? 0;
  const secundariosJson = JSON.stringify(cnaes_secundarios ?? []);

  const sql = `
    INSERT INTO empresas (
      tenant_id, nome, cnpj, matriz_ou_filial, razao_social, ramo_atuacao,
      cnae_principal_codigo, cnae_principal_descricao, cnaes_secundarios_json,
      cep, endereco, cidade, estado, logo_url,
      parametro_maturidade, termometro_sancoes_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const result = await tenantExecute(tenantId, sql, [
    nome,
    cnpj,
    matriz_ou_filial,
    razao_social,
    ramo_atuacao ?? null,
    cnae_principal_codigo ?? null,
    cnae_principal_descricao ?? null,
    secundariosJson,
    cep ?? null,
    endereco ?? null,
    cidade ?? null,
    estado ?? null,
    logo_url ?? null,
    maturidade,
    termometro
  ]);

  await logChange('Empresa', 'CREATE', { tenantId, ...dados });

  return {
    id: (result as any).insertId,
    nome,
    cnpj,
    matriz_ou_filial,
    razao_social,
    ramo_atuacao: ramo_atuacao ?? null,
    cnae_principal_codigo: cnae_principal_codigo ?? null,
    cnae_principal_descricao: cnae_principal_descricao ?? null,
    cnaes_secundarios: cnaes_secundarios ?? [],
    cep: cep ?? null,
    endereco: endereco ?? null,
    cidade: cidade ?? null,
    estado: estado ?? null,
    logo_url: logo_url ?? null,
    parametro_maturidade: maturidade,
    termometro_sancoes_id: termometro
  };
}

// Busca empresa por ID dentro do tenant
export async function obterEmpresaPorIdService(
  id: number,
  tenantId: number
): Promise<Empresa | null> {
  const rows = await tenantQuery<EmpresaRow>(
    tenantId,
    'SELECT * FROM empresas WHERE tenant_id = ? AND id = ?',
    [id]
  );

  if (!rows.length) return null;

  await logChange('Empresa', 'INFO', { tenantId, message: `consulta por id: ${id}` });

  return mapEmpresaRow(rows[0]);
}

// Atualiza empresa do tenant
export async function atualizarEmpresaService(
  id: number,
  dados: Empresa,
  tenantId: number
): Promise<Empresa | null> {
  const {
    nome,
    cnpj,
    matriz_ou_filial,
    razao_social,
    ramo_atuacao,
    cnae_principal_codigo,
    cnae_principal_descricao,
    cnaes_secundarios,
    cep,
    endereco,
    cidade,
    estado,
    logo_url,
    parametro_maturidade,
    termometro_sancoes_id
  } = dados;
  const maturidade = parametro_maturidade ?? 0;
  const termometro = termometro_sancoes_id ?? 0;
  const secundariosJson = JSON.stringify(cnaes_secundarios ?? []);

  const sql = `
    UPDATE empresas
       SET tenant_id = ?, nome = ?, cnpj = ?, matriz_ou_filial = ?, razao_social = ?, ramo_atuacao = ?,
           cnae_principal_codigo = ?, cnae_principal_descricao = ?, cnaes_secundarios_json = ?,
           cep = ?, endereco = ?, cidade = ?, estado = ?, logo_url = ?, parametro_maturidade = ?,
           termometro_sancoes_id = ?
     WHERE tenant_id = ? AND id = ?
  `;

  const result = await tenantExecute(tenantId, sql, [
    nome,
    cnpj,
    matriz_ou_filial,
    razao_social,
    ramo_atuacao ?? null,
    cnae_principal_codigo ?? null,
    cnae_principal_descricao ?? null,
    secundariosJson,
    cep ?? null,
    endereco ?? null,
    cidade ?? null,
    estado ?? null,
    logo_url ?? null,
    maturidade,
    termometro,
    tenantId,
    id
  ]);

  const { affectedRows } = result as any;
  if (!affectedRows) {
    return obterEmpresaPorIdService(id, tenantId);
  }

  await logChange('Empresa', 'UPDATE', { tenantId, id, dados });

  return {
    id,
    nome,
    cnpj,
    matriz_ou_filial,
    razao_social,
    ramo_atuacao: ramo_atuacao ?? null,
    cnae_principal_codigo: cnae_principal_codigo ?? null,
    cnae_principal_descricao: cnae_principal_descricao ?? null,
    cnaes_secundarios: cnaes_secundarios ?? [],
    cep: cep ?? null,
    endereco: endereco ?? null,
    cidade: cidade ?? null,
    estado: estado ?? null,
    logo_url: logo_url ?? null,
    parametro_maturidade: maturidade,
    termometro_sancoes_id: termometro
  };
}

// Deleta empresa do tenant
export async function deletarEmpresaService(
  id: number,
  tenantId: number
): Promise<boolean> {
  const sql = 'DELETE FROM empresas WHERE tenant_id = ? AND id = ?';

  const result = await tenantExecute(tenantId, sql, [id]);
  const { affectedRows } = result as any;

  await logChange('Empresa', 'DELETE', { tenantId, id });

  return !!affectedRows;
}
