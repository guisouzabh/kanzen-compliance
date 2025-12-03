import bcrypt from 'bcrypt';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { pool } from '../config/db';
import { Usuario } from '../types/Usuario';
import { AppError } from '../errors/AppError';

const JWT_SECRET: Secret = (process.env.JWT_SECRET ?? 'changeme') as Secret;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h'; // string mesmo

export async function registrarUsuarioService(dados: Usuario): Promise<Usuario> {
  const { nome, email, senha } = dados;

  if (!senha) {
    throw new AppError('Senha é obrigatória', 400);
  }

  const senha_hash = await bcrypt.hash(senha, 10);

  const [result] = await pool.query(
    'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
    [nome, email, senha_hash]
  );

  return {
    id: (result as any).insertId,
    nome,
    email
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
    tenantId: usuario.tenant_id
  };

  const options: SignOptions = {
    // o as any aqui resolve o conflito de tipo com a definição do jsonwebtoken
    expiresIn: JWT_EXPIRES_IN as any
  };

  const token = jwt.sign(payload, JWT_SECRET, options);

  return { token };
}
