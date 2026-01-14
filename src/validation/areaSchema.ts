import { z } from 'zod';

export const areaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().max(500, 'Descrição muito longa').optional().nullable(),
  unidade_id: z.number().int().positive({ message: 'Unidade é obrigatória' }),
  latitude: z
    .number({ coerce: true })
    .min(-90, 'Latitude inválida')
    .max(90, 'Latitude inválida')
    .nullable()
    .optional(),
  longitude: z
    .number({ coerce: true })
    .min(-180, 'Longitude inválida')
    .max(180, 'Longitude inválida')
    .nullable()
    .optional()
}).refine(
  (data) =>
    (data.latitude == null && data.longitude == null) ||
    (data.latitude != null && data.longitude != null),
  {
    message: 'Latitude e longitude devem ser informadas juntas',
    path: ['latitude']
  }
);

export type AreaInput = z.infer<typeof areaSchema>;
