import { z } from 'zod';

const dataRegex = /^\d{4}-\d{2}-\d{2}$/;

export const configuracaoTreinamentoSchema = z.object({
  quiz_habilitado:         z.number().int().min(0).max(1).optional(),
  nota_minima:             z.number().min(0).max(100).optional().nullable(),
  max_tentativas:          z.number().int().min(1).optional().nullable(),
  tipo_identificador:      z.string().max(50).optional(),
  label_identificador:     z.string().max(100).optional(),
  link_publico_habilitado: z.number().int().min(0).max(1).optional()
});

export const treinamentoMaterialSchema = z.object({
  titulo: z.string().min(1).max(255),
  tipo:   z.enum(['LINK', 'PDF', 'VIDEO']),
  url:    z.string().min(1).max(500),
  ordem:  z.number().int().min(0).optional()
});

export const alternativaSchema = z.object({
  texto:  z.string().min(1, 'Texto da alternativa é obrigatório'),
  correta: z.boolean()
});

export const treinamentoQuizPerguntaSchema = z.object({
  pergunta:     z.string().min(1, 'Pergunta é obrigatória'),
  alternativas: z.array(alternativaSchema).min(2, 'Mínimo 2 alternativas').max(10),
  ordem:        z.number().int().min(0).optional()
});

export const participanteSchema = z.object({
  colaborador_id: z.number().int().positive()
});

export const importarParticipantesSchema = z.object({
  empresa_id:    z.number().int().positive(),
  participantes: z.array(z.object({
    nome:            z.string().min(1).max(255),
    email:           z.string().email(),
    identificador:   z.string().max(100).optional().nullable(),
    data_nascimento: z.string().regex(dataRegex).optional().nullable(),
    cargo:           z.string().max(150).optional().nullable()
  })).min(1)
});

export const clonarTurmaSchema = z.object({
  tema:            z.string().min(1).max(255).optional(),
  prazo_conclusao: z.string().regex(dataRegex).optional().nullable()
});

export const identificarParticipanteSchema = z.object({
  identificador:   z.string().min(1),
  data_nascimento: z.string().regex(dataRegex)
});

export const finalizarQuizSchema = z.object({
  execucao_id: z.number().int().positive(),
  respostas:   z.array(z.object({
    pergunta_id:      z.number().int().positive(),
    alternativa_index: z.number().int().min(0)
  })).min(1)
});

export type ConfiguracaoTreinamentoInput = z.infer<typeof configuracaoTreinamentoSchema>;
export type TreinamentoMaterialInput     = z.infer<typeof treinamentoMaterialSchema>;
export type TreinamentoQuizPerguntaInput = z.infer<typeof treinamentoQuizPerguntaSchema>;
export type ParticipanteInput            = z.infer<typeof participanteSchema>;
export type ImportarParticipantesInput   = z.infer<typeof importarParticipantesSchema>;
export type ClonarTurmaInput             = z.infer<typeof clonarTurmaSchema>;
export type IdentificarParticipanteInput = z.infer<typeof identificarParticipanteSchema>;
export type FinalizarQuizInput           = z.infer<typeof finalizarQuizSchema>;
