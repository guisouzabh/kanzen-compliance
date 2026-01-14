import bcrypt from 'bcrypt';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { pool } from '../config/db';
import { tenantQuery } from '../db/tenantDb';
import { Usuario } from '../types/Usuario';
import { AppError } from '../errors/AppError';

const JWT_SECRET: Secret = (process.env.JWT_SECRET ?? 'changeme') as Secret;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h'; // string mesmo

export async function registrarUsuarioService(dados: Usuario): Promise<Usuario> {
  const { nome, email, senha, tenant_id, empresa_id, area_id } = dados;

  if (!senha) {
    throw new AppError('Senha é obrigatória', 400);
  }

  // valida vínculos opcionais com empresa e área dentro do tenant
  if (empresa_id) {
    const empresas = await tenantQuery<{ id: number }>(
      tenant_id,
      'SELECT id FROM empresas WHERE tenant_id = ? AND id = ?',
      [empresa_id]
    );
    if (!empresas.length) {
      throw new AppError('Empresa inválida para este tenant', 400);
    }
  }

  if (area_id) {
    const areas = await tenantQuery<{ id: number }>(
      tenant_id,
      'SELECT id FROM areas WHERE tenant_id = ? AND id = ?',
      [area_id]
    );
    if (!areas.length) {
      throw new AppError('Área inválida para este tenant', 400);
    }
    if (empresa_id) {
      const vinculos = await tenantQuery<{ id: number }>(
        tenant_id,
        `
          SELECT a.id
            FROM areas a
            JOIN unidades u ON u.id = a.unidade_id AND u.tenant_id = a.tenant_id
           WHERE a.tenant_id = ? AND a.id = ? AND u.empresa_id = ?
        `,
        [area_id, empresa_id]
      );
      if (!vinculos.length) {
        throw new AppError('Área não pertence à empresa informada', 400);
      }
    }
  }

  const senha_hash = await bcrypt.hash(senha, 10);

  const [result] = await pool.query(
    `
      INSERT INTO usuarios (nome, email, senha_hash, tenant_id, empresa_id, area_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [nome, email, senha_hash, tenant_id, empresa_id ?? null, area_id ?? null]
  );

  return {
    id: (result as any).insertId,
    nome,
    email,
    empresa_id: empresa_id ?? undefined,
    area_id: area_id ?? undefined
  };
}

export async function loginService(
  email: string,
  senha: string
): Promise<{ token: string }> {
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
  const usuarios = rows as any[];

  if (!usuarios.length) {
    throw new AppError('Credenciais inválidas', 401);
  }

  const usuario = usuarios[0];

  const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);
  if (!senhaOk) {
    throw new AppError('Credenciais inválidas', 401);
  }

  const payload = {
    sub: usuario.id,
    email: usuario.email,
    nome: usuario.nome,
    tenantId: usuario.tenant_id,
    empresaId: usuario.empresa_id ?? null,
    areaId: usuario.area_id ?? null
  };

  const options: SignOptions = {
    // o as any aqui resolve o conflito de tipo com a definição do jsonwebtoken
    expiresIn: JWT_EXPIRES_IN as any
  };

  const token = jwt.sign(payload, JWT_SECRET, options);

  return { token };
}
