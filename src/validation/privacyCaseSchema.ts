import { z } from 'zod';

const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
const dateTimeRegex = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/;

const statusEnum = z.enum([
  'ABERTO',
  'EM_TRIAGEM',
  'EM_ANALISE',
  'DECISAO_COMUNICACAO',
  'CONCLUIDO',
  'DESCARTADO'
]);

const severidadeEnum = z.enum(['ALTA', 'MEDIA', 'BAIXA']);

const decisaoComunicacaoEnum = z.enum(['PENDENTE', 'SIM', 'NAO']);

export const privacyCaseIncidentDetailsSchema = z.object({
  dados_afetados: z.string().optional().nullable(),
  titulares_afetados_estimado: z.number().int().min(0).optional().nullable(),
  impacto_descricao: z.string().optional().nullable(),
  medidas_contencao: z.string().optional().nullable(),
  decisao_comunicar_anpd: decisaoComunicacaoEnum.optional(),
  decisao_comunicar_titulares: decisaoComunicacaoEnum.optional(),
  justificativa_decisao: z.string().optional().nullable(),
  data_decisao: z.string().regex(dateTimeRegex, 'Data de decisão inválida').optional().nullable(),
  decisao_por_usuario_id: z.number().int().positive().optional().nullable()
});

export const privacyCaseCreateSchema = z.object({
  empresa_id: z.number().int().positive({ message: 'Empresa é obrigatória' }),
  origem: z.enum(['INTERNO', 'EXTERNO']),
  titulo: z.string().min(1, 'Título é obrigatório').max(255),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  status: statusEnum.optional(),
  severidade: severidadeEnum.optional(),
  responsavel_id: z.number().int().positive().optional().nullable(),
  prazo: z.string().regex(dataRegex, 'Prazo inválido').optional().nullable(),
  anonimo: z.boolean().optional(),
  reportante_nome: z.string().max(255).optional().nullable(),
  reportante_email: z.string().email('E-mail inválido').optional().nullable(),
  reportante_canal: z.string().max(50).optional().nullable(),
  aceita_contato: z.boolean().optional(),
  detalhes_incidente: privacyCaseIncidentDetailsSchema.optional()
});

export const privacyCaseUpdateSchema = privacyCaseCreateSchema.partial();

export const privacyCaseTimelineCreateSchema = z.object({
  evento_tipo: z
    .enum([
      'CRIACAO',
      'ATUALIZACAO',
      'COMENTARIO',
      'MUDANCA_STATUS',
      'MUDANCA_SEVERIDADE',
      'DECISAO_COMUNICACAO',
      'ANEXO_ADICIONADO',
      'ANEXO_REMOVIDO'
    ])
    .optional(),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  metadata: z.record(z.string(), z.unknown()).optional().nullable()
});

export const privacyCasePublicCreateSchema = z.object({
  empresa_id: z.number().int().positive({ message: 'Empresa é obrigatória' }),
  titulo: z.string().min(1, 'Título é obrigatório').max(255),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  severidade: severidadeEnum.optional(),
  anonimo: z.boolean().optional(),
  reportante_nome: z.string().max(255).optional().nullable(),
  reportante_email: z.string().email('E-mail inválido').optional().nullable(),
  reportante_canal: z.string().max(50).optional().nullable(),
  aceita_contato: z.boolean().optional()
});

export const privacyCaseAssignSchema = z.object({
  responsavel_id: z.number().int().positive({ message: 'Responsável é obrigatório' }),
  prazo: z.string().regex(dataRegex, 'Prazo inválido').optional().nullable(),
  status: z.enum(['EM_TRIAGEM', 'EM_ANALISE', 'DECISAO_COMUNICACAO']).optional()
});

export const privacyCaseCommunicationDecisionRequestSchema = z.object({
  comite_id: z.number().int().positive({ message: 'Comitê é obrigatório' }),
  mensagem: z.string().max(1000).optional().nullable()
});

export const privacyCaseDecisionApprovalSchema = z
  .object({
    comite_id: z.number().int().positive({ message: 'Comitê é obrigatório' }),
    aprovado: z.boolean().optional().default(true),
    decisao_comunicar_anpd: z.enum(['SIM', 'NAO']).optional().nullable(),
    decisao_comunicar_titulares: z.enum(['SIM', 'NAO']).optional().nullable(),
    justificativa: z.string().max(2000).optional().nullable()
  })
  .superRefine((value, ctx) => {
    if (value.aprovado) {
      if (!value.decisao_comunicar_anpd) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['decisao_comunicar_anpd'],
          message: 'Decisão ANPD é obrigatória quando aprovado'
        });
      }
      if (!value.decisao_comunicar_titulares) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['decisao_comunicar_titulares'],
          message: 'Decisão de titulares é obrigatória quando aprovado'
        });
      }
    }
  });

export const privacyCaseCommunicationDecisionFinalizeSchema = z.object({
  comite_id: z.number().int().positive({ message: 'Comitê é obrigatório' }),
  decisao_comunicar_anpd: z.enum(['SIM', 'NAO']),
  decisao_comunicar_titulares: z.enum(['SIM', 'NAO']),
  justificativa_decisao: z.string().max(3000).optional().nullable(),
  data_decisao: z.string().regex(dateTimeRegex, 'Data de decisão inválida').optional().nullable(),
  status_final: z.enum(['DECISAO_COMUNICACAO', 'CONCLUIDO']).optional()
});

export type PrivacyCaseCreateInput = z.infer<typeof privacyCaseCreateSchema>;
export type PrivacyCaseUpdateInput = z.infer<typeof privacyCaseUpdateSchema>;
export type PrivacyCaseTimelineCreateInput = z.infer<typeof privacyCaseTimelineCreateSchema>;
export type PrivacyCasePublicCreateInput = z.infer<typeof privacyCasePublicCreateSchema>;
export type PrivacyCaseAssignInput = z.infer<typeof privacyCaseAssignSchema>;
export type PrivacyCaseCommunicationDecisionRequestInput = z.infer<
  typeof privacyCaseCommunicationDecisionRequestSchema
>;
export type PrivacyCaseDecisionApprovalInput = z.infer<typeof privacyCaseDecisionApprovalSchema>;
export type PrivacyCaseCommunicationDecisionFinalizeInput = z.infer<
  typeof privacyCaseCommunicationDecisionFinalizeSchema
>;
