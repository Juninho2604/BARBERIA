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
 * Si no hay INITIAL_OWNER_*, el seed solo sincroniza servicios (catálogo)
 * sin tocar usuarios. Los barberos NO se siembran: se gestionan desde el
 * panel /admin/barbers (sembrarlos los resucitaba en cada deploy).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Catálogo confirmado por el cliente (junio 2026). Nombres en inglés
// (decisión de marca), descripciones en español. Orden = orden de
// presentación en landing y flujo de reserva.
//
// "Eyebrows" no tenía duración en el documento; usamos 10 min para que
// ocupe un slot razonable sin solapar con servicios largos.
const SERVICES = [
  {
    name: "Men's haircut",
    description: "Corte de cabello para hombres y niños, clásico o desvanecido.",
    durationMinutes: 45,
    priceCents: 3500,
  },
  {
    name: "Regular beard",
    description: "Alineado y trim de barba.",
    durationMinutes: 20,
    priceCents: 2000,
  },
  {
    name: "Men's haircut & regular beard",
    description: "Corte de cabello clásico o desvanecido y trim de barba.",
    durationMinutes: 60,
    priceCents: 5000,
  },
  {
    name: "Hot towel shave",
    description:
      "Afeitado o estilo de barba con toalla caliente, vapor, espuma, aceite para la barba y toalla fría al finalizar.",
    durationMinutes: 30,
    priceCents: 3000,
  },
  {
    name: "Men's haircut & hot towel shave",
    description:
      "Corte de cabello clásico o desvanecido más afeitado/estilo de barba con toalla caliente, vapor, espuma, aceite para la barba y toalla fría al finalizar.",
    durationMinutes: 60,
    priceCents: 6000,
  },
  {
    name: "Eyebrows",
    description: "Limpieza de cejas.",
    durationMinutes: 10,
    priceCents: 1000,
  },
  {
    name: "Nose & ear wax",
    description: "Depilación con cera caliente para nariz y orejas.",
    durationMinutes: 10,
    priceCents: 1000,
  },
  {
    name: "Brothers Club Experience",
    description:
      "Incluye haircut, hot towel shave, nose & ear wax, eyebrows, collagen mask y bebida especial.",
    durationMinutes: 75,
    priceCents: 9000,
  },
];

// NOTA: ya NO sembramos barberos demo (Juan/Luis). Los barberos reales
// (Roman/Edgar/Francesco/Victor — dueños a la vez) se crean y gestionan
// desde el panel /admin/barbers. Sembrarlos aquí los RESUCITABA en cada
// arranque del contenedor (el seed corre en cada deploy): tras borrarlos
// desde el panel, el siguiente deploy los recreaba. Mantener esta lista
// vacía evita ese zombie.

async function seedServices() {
  for (const svc of SERVICES) {
    const existing = await prisma.service.findFirst({ where: { name: svc.name } });
    if (existing) {
      // Sync precio/duración/descripción al catálogo del seed (que es la
      // fuente de verdad). Sin esto, cambios en este archivo nunca se
      // reflejaban en deploys donde el servicio ya estaba creado.
      // isActive se respeta — si admin desactivó algo, no lo reactivamos.
      const needsUpdate =
        existing.description !== svc.description ||
        existing.durationMinutes !== svc.durationMinutes ||
        existing.priceCents !== svc.priceCents;
      if (needsUpdate) {
        await prisma.service.update({
          where: { id: existing.id },
          data: {
            description: svc.description,
            durationMinutes: svc.durationMinutes,
            priceCents: svc.priceCents,
          },
        });
        console.log(`[seed] ~service ${svc.name} (sync)`);
      }
      continue;
    }
    await prisma.service.create({ data: { ...svc, isActive: true } });
    console.log(`[seed] +service ${svc.name}`);
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
