import { z } from "zod";

const WorkingHourBase = z.object({
  weekday: z.number().int().min(0).max(6),
  startMin: z.number().int().min(0).max(1440),
  endMin: z.number().int().min(0).max(1440),
});

// Tope de bloques por semana (7 días × 3 turnos sobra). Junto con el
// bodyLimit de la API evita que un array enorme agote la memoria al validar.
const MAX_WORKING_BLOCKS = 21;

export const WorkingHourSchema = WorkingHourBase.refine(
  (wh) => wh.endMin > wh.startMin,
  { message: "endMin debe ser mayor que startMin" },
);
export type WorkingHourInput = z.infer<typeof WorkingHourSchema>;

export const BarberSchema = z.object({
  id: z.string(),
  // Solo en respuestas a staff con barbers.manage; la ficha pública los omite.
  userId: z.string().optional(),
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  bio: z.string().nullable(),
  photoUrl: z.string().nullable(),
  isActive: z.boolean(),
  workingHours: z.array(
    WorkingHourBase.extend({ id: z.string(), barberId: z.string() }),
  ).optional(),
});
export type Barber = z.infer<typeof BarberSchema>;

// HTTPS-only para photoUrl: evita mixed-content y pixel-tracking desde
// dominios HTTP arbitrarios cuando se renderiza en /reservar y /admin.
const httpsUrl = z
  .string()
  .url()
  .startsWith("https://", "La URL debe ser HTTPS");

export const CreateBarberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(80),
  phone: z.string().min(6).max(20).optional(),
  bio: z.string().max(500).optional(),
  photoUrl: httpsUrl.optional(),
  workingHours: z.array(WorkingHourSchema).max(MAX_WORKING_BLOCKS).optional(),
});
export type CreateBarberInput = z.infer<typeof CreateBarberSchema>;

export const UpdateBarberSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().min(6).max(20).nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  photoUrl: httpsUrl.nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateBarberInput = z.infer<typeof UpdateBarberSchema>;

export const SetWorkingHoursSchema = z.object({
  workingHours: z.array(WorkingHourSchema).max(MAX_WORKING_BLOCKS),
});
export type SetWorkingHoursInput = z.infer<typeof SetWorkingHoursSchema>;
