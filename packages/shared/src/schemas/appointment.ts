import { z } from "zod";

export const AppointmentStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

export const CreateAppointmentSchema = z.object({
  serviceId: z.string(),
  barberId: z.string(),
  startsAt: z.string().datetime(),
  // Para reserva sin cuenta — opcionales si el cliente ya está autenticado
  guest: z
    .object({
      name: z.string().min(2).max(80),
      email: z.string().email(),
      phone: z.string().min(6).max(20),
    })
    .optional(),
  notes: z.string().max(500).optional(),
});
export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;
