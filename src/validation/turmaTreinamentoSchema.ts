import { z } from 'zod';

const dataRegex = /^\d{4}-\d{2}-\d{2}$/;

export const turmaTreinamentoSchema = z.object({
  empresa_id:             z.number().int().positive({ message: 'Empresa é obrigatória' }),
  tema:                   z.string().min(1, 'Tema é obrigatório').max(255),
  instrutor:              z.string().max(255).optional().nullable(),
  modalidade:             z.enum(['PRESENCIAL', 'ONLINE', 'HIBRIDO']).optional().default('PRESENCIAL'),
  data_inicio:            z.string().regex(dataRegex, 'data_inicio inválida').optional().nullable(),
  data_fim:               z.string().regex(dataRegex, 'data_fim inválida').optional().nullable(),
  carga_horaria:          z.number().positive().max(9999.9).optional().nullable(),
  local_realizacao:       z.string().max(255).optional().nullable(),
  status:                 z.enum(['AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']).optional().default('AGENDADA'),
  prazo_conclusao:        z.string().regex(dataRegex, 'prazo_conclusao inválida').optional().nullable(),
  created_by_usuario_id:  z.number().int().positive().optional().nullable(),
  responsavel_id:         z.number().int().positive().optional().nullable()
});

export type TurmaTreinamentoInput = z.infer<typeof turmaTreinamentoSchema>;
