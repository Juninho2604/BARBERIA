import { z } from "zod";

// photoUrl: HTTPS-only por consistencia con barber.photoUrl. Validamos
// el prefijo en vez de z.string().url() para rechazar http:// silenciosamente.
const PhotoUrl = z
  .string()
  .max(2048)
  .refine((v) => v.startsWith("https://"), {
    message: "photoUrl debe empezar con https://",
  });

export const ServiceSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(80),
  description: z.string().max(500).nullable(),
  // 5 min mínimo para servicios cortos (Eyebrows, Nose & ear wax).
  // Antes era 15, lo que bloqueaba edición admin de los wax/eyebrow.
  durationMinutes: z.number().int().min(5).max(240),
  priceCents: z.number().int().nonnegative(),
  photoUrl: z.string().nullable(),
  isActive: z.boolean(),
});
export type Service = z.infer<typeof ServiceSchema>;

export const CreateServiceSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  durationMinutes: z.number().int().min(5).max(240),
  priceCents: z.number().int().nonnegative(),
  photoUrl: PhotoUrl.optional(),
  isActive: z.boolean().optional().default(true),
});
export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;

export const UpdateServiceSchema = CreateServiceSchema.partial().extend({
  // En update aceptamos null explícito para borrar la foto existente.
  photoUrl: PhotoUrl.nullable().optional(),
});
export type UpdateServiceInput = z.infer<typeof UpdateServiceSchema>;
