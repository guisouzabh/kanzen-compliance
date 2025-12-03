import { pool } from '../config/db';
import { Empresa } from '../types/Empresa';
import { logChange } from './auditService';

// Lista todas as empresas
export async function listarEmpresasService(): Promise<Empresa[]> {
  const [rows] = await pool.query('SELECT * FROM empresas');
  return rows as Empresa[];
}

// Cria empresa
export async function criarEmpresaService(dados: Empresa): Promise<Empresa> {
  const { nome, cnpj, matriz_ou_filial, razao_social } = dados;

  const sql = `
    INSERT INTO empresas (nome, cnpj, matriz_ou_filial, razao_social)
    VALUES (?, ?, ?, ?)
  `;

  const [result] = await pool.query(sql, [
    nome,
    cnpj,
    matriz_ou_filial,
    razao_social
  ]);

  await logChange('Empresa','CREATE', dados);

  return {
    id: (result as any).insertId,
    nome,
    cnpj,
    matriz_ou_filial,
    razao_social
  };
}

// Busca empresa por ID
export async function obterEmpresaPorIdService(id: number): Promise<Empresa | null> {
  const [rows] = await pool.query('SELECT * FROM empresas WHERE id = ?', [id]);
  const empresas = rows as Empresa[];

  if (!empresas.length) return null;

  await logChange('Empresa','INFO', `consulta por id: ${id}`);

  return empresas[0];
}

// Atualiza empresa
export async function atualizarEmpresaService(id: number, dados: Empresa): Promise<Empresa | null> {
  const { nome, cnpj, matriz_ou_filial, razao_social } = dados;

  const sql = `
    UPDATE empresas
    SET nome = ?, cnpj = ?, matriz_ou_filial = ?, razao_social = ?
    WHERE id = ?
  `;

  const [result] = await pool.query(sql, [
    nome,
    cnpj,
    matriz_ou_filial,
    razao_social,
    id
  ]);

  const { affectedRows } = result as any;
  if (!affectedRows) {
    return null;
  }

  await logChange('Empresa','UPDATE', result);

  return {
    id,
    nome,
    cnpj,
    matriz_ou_filial,
    razao_social
  };
}

// Deleta empresa
export async function deletarEmpresaService(id: number): Promise<boolean> {
  const [result] = await pool.query('DELETE FROM empresas WHERE id = ?', [id]);
  const { affectedRows } = result as any;

  await logChange('Empresa','DELETE', 'id:' + id);

  return !!affectedRows;
}
