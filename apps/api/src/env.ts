import { z } from "zod";

// Patrones de secret notoriamente débiles que rechazamos. Si alguien copia
// `.env.example` tal cual o usa "password"/"secret"/"change-me", el arranque
// falla con mensaje claro.
const WEAK_SECRET_PATTERNS = [
  /^change-me/i,
  /^default/i,
  /^password/i,
  /^secret/i,
  /^test/i,
  /^example/i,
  /^(.)\1+$/, // mismo char repetido
];

const strongSecret = z
  .string()
  .min(32, "JWT secret debe tener mínimo 32 caracteres (256 bits)")
  .refine(
    (s) => !WEAK_SECRET_PATTERNS.some((p) => p.test(s)),
    "JWT secret parece un placeholder común (change-me, password, secret…). Genera uno con `openssl rand -base64 48`.",
  );

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().url(),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000")
    .transform((s) => s.split(",").map((o) => o.trim()).filter(Boolean)),
  JWT_ACCESS_SECRET: strongSecret,
  JWT_REFRESH_SECRET: strongSecret,
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("30d"),
  DEFAULT_TIMEZONE: z.string().default("America/Caracas"),
  SLOT_GRANULARITY_MINUTES: z.coerce.number().int().positive().default(30),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Variables de entorno inválidas:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}
