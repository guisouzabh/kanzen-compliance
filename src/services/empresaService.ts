import { Empresa } from '../types/Empresa';
import { logChange } from './auditService';
import { tenantQuery, tenantExecute } from '../db/tenantDb'

// Lista todas as empresas do tenant
export async function listarEmpresasService(tenantId: number): Promise<Empresa[]> {
  const rows = await tenantQuery<Empresa>(
    tenantId,
    'SELECT * FROM empresas WHERE tenant_id = ?'
  );
  return rows;
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

  const sql = `
    INSERT INTO empresas (
      tenant_id, nome, cnpj, matriz_ou_filial, razao_social, cep, endereco, cidade, estado, logo_url,
      parametro_maturidade, termometro_sancoes_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const result = await tenantExecute(tenantId, sql, [
    nome,
    cnpj,
    matriz_ou_filial,
    razao_social,
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
  const rows = await tenantQuery<Empresa>(
    tenantId,
    'SELECT * FROM empresas WHERE tenant_id = ? AND id = ?',
    [id]
  );

  if (!rows.length) return null;

  await logChange('Empresa', 'INFO', { tenantId, message: `consulta por id: ${id}` });

  return rows[0];
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

  const sql = `
    UPDATE empresas
       SET tenant_id = ?, nome = ?, cnpj = ?, matriz_ou_filial = ?, razao_social = ?,
           cep = ?, endereco = ?, cidade = ?, estado = ?, logo_url = ?, parametro_maturidade = ?,
           termometro_sancoes_id = ?
     WHERE tenant_id = ? AND id = ?
  `;

  const result = await tenantExecute(tenantId, sql, [
    nome,
    cnpj,
    matriz_ou_filial,
    razao_social,
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
