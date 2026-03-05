import { z } from 'zod';

export const diagnosticoModeloSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().max(2000).optional().nullable(),
  dm_escopo_id: z.number().int().positive({ message: 'Escopo é obrigatório' }),
  versao: z.number().int().min(1).optional(),
  ativo: z.boolean().optional()
});

export const diagnosticoPerguntaSchema = z.object({
  modelo_id: z.number().int().positive({ message: 'modelo_id é obrigatório' }),
  codigo: z.string().min(1, 'Código é obrigatório'),
  dominio: z.string().min(1, 'Domínio é obrigatório'),
  macro_dominio: z.string().min(1, 'Macro domínio é obrigatório'),
  pergunta: z.string().min(1, 'Pergunta é obrigatória'),
  opcao_0: z.string().min(1, 'Opção 0 é obrigatória'),
  opcao_1: z.string().min(1, 'Opção 1 é obrigatória'),
  opcao_2: z.string().min(1, 'Opção 2 é obrigatória'),
  opcao_3: z.string().min(1, 'Opção 3 é obrigatória'),
  peso: z.number().int().min(1).max(10).default(1),
  ordem: z.number().int().min(0).optional(),
  ativo: z.boolean().optional()
});

export const diagnosticoExecucaoSchema = z.object({
  empresa_id: z.number().int().positive({ message: 'empresa_id é obrigatório' }),
  modelo_id: z.number().int().positive({ message: 'modelo_id é obrigatório' })
});

export const diagnosticoRespostasSchema = z.object({
  respostas: z
    .array(
      z.object({
        pergunta_id: z.number().int().positive({ message: 'pergunta_id inválido' }),
        opcao: z.number().int().min(0).max(3),
        observacoes: z.string().max(2000).optional().nullable()
      })
    )
    .min(1, 'Respostas são obrigatórias')
});

export const diagnosticoAcoesSchema = z.object({
  acoes: z
    .array(
      z.object({
        acao: z.string().min(1, 'Ação é obrigatória'),
        objetivo: z.string().max(2000).optional().nullable(),
        macro_dominio: z.string().max(100).optional().nullable(),
        prioridade: z.number().int().min(1).max(5).optional(),
        esforco: z.number().int().min(1).max(5).optional()
      })
    )
    .min(1, 'Ações são obrigatórias')
});

export type DiagnosticoModeloInput = z.infer<typeof diagnosticoModeloSchema>;
export type DiagnosticoPerguntaInput = z.infer<typeof diagnosticoPerguntaSchema>;
export type DiagnosticoExecucaoInput = z.infer<typeof diagnosticoExecucaoSchema>;
export type DiagnosticoRespostasInput = z.infer<typeof diagnosticoRespostasSchema>;
export type DiagnosticoAcoesInput = z.infer<typeof diagnosticoAcoesSchema>;
