import { z } from "zod";

/**
 * Cliente — proyección agregada de un User con métricas calculadas a partir
 * de su historial de citas. No es una tabla nueva; en backend real es una
 * vista o query sobre User + Appointment.
 */
export const ClientSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  totalAppointments: z.number().int(),
  completedAppointments: z.number().int(),
  /** Lifetime Value en céntimos — suma de priceCents de citas COMPLETED. */
  lifetimeCents: z.number().int(),
  firstVisitAt: z.string().nullable(),
  lastVisitAt: z.string().nullable(),
  /** Notas internas del staff (alergias, preferencias…). */
  notes: z.string().nullable(),
});
export type ClientSummary = z.infer<typeof ClientSummarySchema>;

export const ClientDetailSchema = ClientSummarySchema.extend({
  appointments: z.array(
    z.object({
      id: z.string(),
      startsAt: z.string(),
      endsAt: z.string(),
      status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]),
      serviceName: z.string(),
      barberName: z.string(),
      priceCents: z.number().int(),
    }),
  ),
});
export type ClientDetail = z.infer<typeof ClientDetailSchema>;

export const UpdateClientNotesSchema = z.object({
  notes: z.string().max(2000),
});
export type UpdateClientNotesInput = z.infer<typeof UpdateClientNotesSchema>;
