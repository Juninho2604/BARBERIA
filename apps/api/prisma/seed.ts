/**
 * Seed inicial — se ejecuta automáticamente desde el docker-entrypoint
 * tras `prisma migrate deploy`. Idempotente: si los registros ya existen,
 * no los recrea.
 *
 * Variables de entorno requeridas para el OWNER inicial:
 *   INITIAL_OWNER_EMAIL    — email del primer OWNER (lo usará para login)
 *   INITIAL_OWNER_PASSWORD — contraseña inicial (mínimo 8 chars). Se hashea
 *                            con bcrypt 12 rounds. Después de la primera
 *                            sesión, el usuario puede borrar este valor
 *                            de .env (la cuenta queda en DB con su hash).
 *   INITIAL_OWNER_NAME     — nombre legible (default "Owner")
 *
 * Si no hay INITIAL_OWNER_*, el seed crea servicios y barberos sin tocar
 * usuarios — útil para reseedear catálogo sin tocar cuentas existentes.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SERVICES = [
  { name: "Royal Package",                  description: "Signature treatment.", durationMinutes: 60, priceCents: 11500 },
  { name: "Haircut",                        description: "Hair & beard.",        durationMinutes: 30, priceCents:  4900 },
  { name: "King Shave",                     description: "Hair & beard.",        durationMinutes: 30, priceCents:  4500 },
  { name: "Balding Head Shave",             description: "Hair & beard.",        durationMinutes: 30, priceCents:  5000 },
  { name: "Beard Trim",                     description: "Hair & beard.",        durationMinutes: 30, priceCents:  2500 },
  { name: "Black Mask",                     description: "Spa & skin boosters.", durationMinutes:  5, priceCents:  2000 },
  { name: "Nourishing / Purifying Detox Mask", description: "Spa & skin boosters.", durationMinutes: 15, priceCents: 2000 },
  { name: "Ear Wax",                        description: "Wax services.",        durationMinutes:  5, priceCents:  1500 },
  { name: "Nose Wax",                       description: "Wax services.",        durationMinutes:  5, priceCents:  1500 },
  { name: "Eyebrow Wax",                    description: "Wax services.",        durationMinutes:  5, priceCents:  1500 },
];

const BARBERS = [
  {
    email: "juan@brothersclubbarbers.com",
    name: "Juan",
    bio: "10 años cortando. Especialista en fade.",
    // L-V 9-18, S 10-14
    hours: [
      { weekday: 1, startMin: 540, endMin: 1080 },
      { weekday: 2, startMin: 540, endMin: 1080 },
      { weekday: 3, startMin: 540, endMin: 1080 },
      { weekday: 4, startMin: 540, endMin: 1080 },
      { weekday: 5, startMin: 540, endMin: 1080 },
      { weekday: 6, startMin: 600,  endMin: 840  },
    ],
  },
  {
    email: "luis@brothersclubbarbers.com",
    name: "Luis",
    bio: "Estilo clásico, barbas y afeitado.",
    hours: [
      { weekday: 2, startMin: 660, endMin: 1200 },
      { weekday: 3, startMin: 660, endMin: 1200 },
      { weekday: 4, startMin: 660, endMin: 1200 },
      { weekday: 5, startMin: 660, endMin: 1200 },
      { weekday: 6, startMin: 600, endMin: 1080 },
    ],
  },
];

async function seedServices() {
  for (const svc of SERVICES) {
    const existing = await prisma.service.findFirst({ where: { name: svc.name } });
    if (existing) continue;
    await prisma.service.create({ data: { ...svc, isActive: true } });
    console.log(`[seed] +service ${svc.name}`);
  }
}

async function seedBarbers() {
  for (const b of BARBERS) {
    const existingUser = await prisma.user.findUnique({ where: { email: b.email } });
    if (existingUser) {
      console.log(`[seed] = barber ${b.email} ya existe`);
      continue;
    }
    const user = await prisma.user.create({
      data: {
        email: b.email,
        name: b.name,
        role: "BARBER",
        passwordHash: null,    // reclamable luego con /auth/register
        isActive: true,
      },
    });
    await prisma.barber.create({
      data: {
        userId: user.id,
        bio: b.bio,
        isActive: true,
        workingHours: { create: b.hours },
      },
    });
    console.log(`[seed] +barber ${b.name}`);
  }
}

async function seedOwner() {
  const email = process.env.INITIAL_OWNER_EMAIL?.toLowerCase().trim();
  const password = process.env.INITIAL_OWNER_PASSWORD;
  const name = process.env.INITIAL_OWNER_NAME?.trim() || "Owner";

  if (!email || !password) {
    console.log("[seed] INITIAL_OWNER_EMAIL/PASSWORD no definidos — skip OWNER bootstrap");
    return;
  }
  if (password.length < 8) {
    console.warn("[seed] INITIAL_OWNER_PASSWORD < 8 chars — skip");
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role === "OWNER" || existing.role === "ADMIN") {
      console.log(`[seed] = owner ${email} ya existe`);
      return;
    }
    console.warn(`[seed] ! email ${email} ya está tomado por rol ${existing.role}, no se promociona automáticamente. Hacelo a mano si confirmas que el dueño debe quedarse con esa cuenta.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: "OWNER",
      isActive: true,
    },
  });
  console.log(`[seed] +owner ${email}`);
  console.warn("[seed] ⚠ Borrá INITIAL_OWNER_PASSWORD de .env después del primer arranque (el hash ya está en DB).");
}

async function main() {
  console.log("[seed] arrancando…");
  await seedServices();
  await seedBarbers();
  await seedOwner();
  console.log("[seed] listo.");
}

main()
  .catch((e) => {
    console.error("[seed] error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
