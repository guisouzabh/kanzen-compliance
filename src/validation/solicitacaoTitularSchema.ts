import { z } from 'zod';

const dataRegex = /^\d{4}-\d{2}-\d{2}$/;

export const solicitacaoTitularSchema = z.object({
  empresa_id: z.number().int().positive({ message: 'Empresa é obrigatória' }),
  canal_entrada: z.string().max(50).optional().nullable(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  cpf: z.string().max(20).optional().nullable(),
  data_nascimento: z
    .string()
    .regex(dataRegex, 'Data de nascimento inválida')
    .optional()
    .nullable(),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().max(50).optional().nullable(),
  endereco: z.string().optional().nullable(),
  tipo_relacao: z
    .enum(['CLIENTE', 'EX_CLIENTE', 'COLABORADOR', 'CANDIDATO', 'PARCEIRO', 'OUTRO'])
    .optional()
    .nullable(),
  identificador_interno: z.string().max(100).optional().nullable(),
  periodo_relacao: z.string().max(100).optional().nullable(),
  tipo_solicitacao: z.enum([
    'ACESSO',
    'CONFIRMACAO',
    'CORRECAO',
    'ANONIMIZACAO_ELIMINACAO',
    'PORTABILIDADE',
    'REVOGACAO_CONSENTIMENTO',
    'INFORMACOES_COMPARTILHAMENTO',
    'OPOSICAO',
    'OUTRO'
  ]),
  descricao_pedido: z.string().min(1, 'Descrição do pedido é obrigatória'),
  categorias_dados: z.string().optional().nullable(),
  sistemas: z.string().optional().nullable(),
  canal_resposta: z.enum(['EMAIL', 'TELEFONE', 'PORTAL', 'OUTRO']).optional().nullable(),
  idioma: z.string().max(20).optional().nullable(),
  declaracao_veracidade: z.boolean().optional(),
  ciente_prazo: z.boolean().optional(),
  autorizacao_uso: z.boolean().optional(),
  status: z.enum(['ABERTO', 'EM_ANALISE', 'EM_TRATATIVA', 'CONCLUIDO', 'NEGADO']).optional(),
  responsavel_id: z.number().int().positive().optional().nullable(),
  prazo_resposta: z.string().regex(dataRegex, 'Prazo inválido').optional().nullable()
});

export type SolicitacaoTitularInput = z.infer<typeof solicitacaoTitularSchema>;
