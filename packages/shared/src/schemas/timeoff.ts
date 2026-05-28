import { z } from "zod";

export const TimeOffSchema = z.object({
  id: z.string(),
  barberId: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  reason: z.string().nullable(),
});
export type TimeOff = z.infer<typeof TimeOffSchema>;

export const CreateTimeOffSchema = z
  .object({
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    reason: z.string().max(200).optional(),
  })
  .refine((t) => new Date(t.endsAt) > new Date(t.startsAt), {
    message: "endsAt debe ser posterior a startsAt",
  });
export type CreateTimeOffInput = z.infer<typeof CreateTimeOffSchema>;
