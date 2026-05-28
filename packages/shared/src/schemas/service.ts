import { z } from "zod";

export const ServiceSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(80),
  description: z.string().max(500).nullable(),
  durationMinutes: z.number().int().min(15).max(240),
  priceCents: z.number().int().nonnegative(),
  isActive: z.boolean(),
});
export type Service = z.infer<typeof ServiceSchema>;

export const CreateServiceSchema = ServiceSchema.omit({ id: true, isActive: true }).extend({
  isActive: z.boolean().default(true),
});
export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;
