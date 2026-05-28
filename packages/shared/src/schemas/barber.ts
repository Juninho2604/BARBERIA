import { z } from "zod";

const WorkingHourBase = z.object({
  weekday: z.number().int().min(0).max(6),
  startMin: z.number().int().min(0).max(1440),
  endMin: z.number().int().min(0).max(1440),
});

export const WorkingHourSchema = WorkingHourBase.refine(
  (wh) => wh.endMin > wh.startMin,
  { message: "endMin debe ser mayor que startMin" },
);
export type WorkingHourInput = z.infer<typeof WorkingHourSchema>;

export const BarberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  bio: z.string().nullable(),
  photoUrl: z.string().nullable(),
  isActive: z.boolean(),
  workingHours: z.array(
    WorkingHourBase.extend({ id: z.string(), barberId: z.string() }),
  ).optional(),
});
export type Barber = z.infer<typeof BarberSchema>;

export const CreateBarberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(80),
  phone: z.string().min(6).max(20).optional(),
  bio: z.string().max(500).optional(),
  photoUrl: z.string().url().optional(),
  workingHours: z.array(WorkingHourSchema).optional(),
});
export type CreateBarberInput = z.infer<typeof CreateBarberSchema>;

export const UpdateBarberSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().min(6).max(20).nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  photoUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateBarberInput = z.infer<typeof UpdateBarberSchema>;

export const SetWorkingHoursSchema = z.object({
  workingHours: z.array(WorkingHourSchema),
});
export type SetWorkingHoursInput = z.infer<typeof SetWorkingHoursSchema>;
