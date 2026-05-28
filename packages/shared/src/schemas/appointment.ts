import { z } from "zod";

export const AppointmentStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

export const GuestSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().min(6).max(20),
});
export type GuestInput = z.infer<typeof GuestSchema>;

export const CreateAppointmentSchema = z.object({
  serviceId: z.string(),
  barberId: z.string(),
  startsAt: z.string().datetime(),
  // Para reserva sin cuenta — requerido si no hay sesión, ignorado si la hay.
  guest: GuestSchema.optional(),
  notes: z.string().max(500).optional(),
});
export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;

export const AppointmentSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  barberId: z.string(),
  serviceId: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  status: AppointmentStatusSchema,
  notes: z.string().nullable(),
  createdAt: z.string(),
  client: z
    .object({
      name: z.string(),
      email: z.string(),
      phone: z.string().nullable(),
    })
    .optional(),
  barber: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
  service: z
    .object({
      id: z.string(),
      name: z.string(),
      durationMinutes: z.number().int(),
      priceCents: z.number().int(),
    })
    .optional(),
});
export type Appointment = z.infer<typeof AppointmentSchema>;

export const AvailabilityQuerySchema = z.object({
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
});
export type AvailabilityQuery = z.infer<typeof AvailabilityQuerySchema>;

export const AvailabilitySlotSchema = z.object({
  startsAt: z.string(),
  endsAt: z.string(),
});
export type AvailabilitySlot = z.infer<typeof AvailabilitySlotSchema>;

export const AvailabilityResponseSchema = z.object({
  date: z.string(),
  tz: z.string(),
  durationMinutes: z.number().int(),
  slots: z.array(AvailabilitySlotSchema),
});
export type AvailabilityResponse = z.infer<typeof AvailabilityResponseSchema>;
