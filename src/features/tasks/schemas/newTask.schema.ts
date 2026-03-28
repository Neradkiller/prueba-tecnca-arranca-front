import { z } from 'zod';

export const newTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'El título es requerido.')
    .max(100, 'El título no puede exceder 100 caracteres.'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  // Local UI-only fields
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tags: z.array(z.string()),
  colorClass: z.string().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
  },
  {
    message: 'La fecha de finalización no puede ser anterior a la de inicio.',
    path: ['endDate'],
  }
);

export type NewTaskFormValues = z.infer<typeof newTaskSchema>;
