import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import type { User as PrismaUser } from "@prisma/client";
import {
  InviteStaffSchema,
  UpdateStaffSchema,
  type StaffMember,
} from "@barberia/shared";
import { prisma } from "../db.js";
import type { AuthGuards } from "../auth/middleware.js";

const IdParam = z.object({ id: z.string().min(1) });

type UserWithBarber = PrismaUser & { barberProfile: { id: string } | null };

function toDto(u: UserWithBarber): StaffMember {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    role: u.role,
    isActive: u.isActive,
    barberId: u.barberProfile?.id ?? null,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
  };
}

/**
 * Rutas de gestión del staff. Solo el rol OWNER puede invitar / cambiar rol
 * / desactivar miembros. Se rige por la matriz `staff.manage` en
 * @barberia/shared.
 */
export function staffRoutes(guards: AuthGuards): FastifyPluginAsync {
  return async (fastify) => {
    const r = fastify.withTypeProvider<ZodTypeProvider>();

    // GET / — lista todo el staff (no incluye CLIENT). Cualquiera con
    // panel.access puede listar pero solo quien tiene staff.manage puede
    // mutarlo.
    r.get(
      "/",
      { preHandler: [guards.requireAuth, guards.requireAction("staff.manage")] },
      async () => {
        const users = await prisma.user.findMany({
          where: { role: { not: "CLIENT" } },
          include: { barberProfile: { select: { id: true } } },
          orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        });
        return users.map(toDto);
      },
    );

    // POST /invite — crea miembro sin password (cuenta reclamable).
    // El email se manda fuera de banda (Resend cuando exista). Por ahora
    // el OWNER comparte la URL manualmente.
    r.post(
      "/invite",
      {
        preHandler: [guards.requireAuth, guards.requireAction("staff.manage")],
        schema: { body: InviteStaffSchema },
      },
      async (req, reply) => {
        const { email, name, role, barberId } = req.body;
        const normalizedEmail = email.toLowerCase();
        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing) {
          return reply.status(409).send({
            error: { code: "EMAIL_EXISTS", message: "Ya existe un usuario con ese email" },
          });
        }
        // Si pidió vincular a un Barber concreto, verificar que existe y
        // no esté ya tomado.
        if (barberId) {
          const barber = await prisma.barber.findUnique({
            where: { id: barberId },
            include: { user: true },
          });
          if (!barber) {
            return reply.status(404).send({
              error: { code: "BARBER_NOT_FOUND", message: "Perfil de barbero no existe" },
            });
          }
          if (barber.user.passwordHash !== null) {
            return reply.status(409).send({
              error: {
                code: "BARBER_HAS_OWNER",
                message: "Ese perfil de barbero ya tiene cuenta asociada",
              },
            });
          }
        }
        const created = await prisma.user.create({
          data: {
            email: normalizedEmail,
            name: name.trim(),
            role,
            passwordHash: null,
            isActive: true,
          },
          include: { barberProfile: { select: { id: true } } },
        });
        // Si el rol es BARBER y nos pasaron barberId, transferimos el
        // perfil al nuevo user (cambia el userId del Barber).
        if (role === "BARBER" && barberId) {
          await prisma.barber.update({
            where: { id: barberId },
            data: { userId: created.id },
          });
        }
        const fresh = await prisma.user.findUnique({
          where: { id: created.id },
          include: { barberProfile: { select: { id: true } } },
        });
        return toDto(fresh!);
      },
    );

    // PATCH /:id — cambiar rol / activar / nombre / teléfono. Guard
    // crítico: no se puede degradar / desactivar al ÚLTIMO OWNER (idéntico
    // al guard del mock).
    r.patch(
      "/:id",
      {
        preHandler: [guards.requireAuth, guards.requireAction("staff.manage")],
        schema: { params: IdParam, body: UpdateStaffSchema },
      },
      async (req, reply) => {
        const target = await prisma.user.findUnique({
          where: { id: req.params.id },
          include: { barberProfile: { select: { id: true } } },
        });
        if (!target) {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Miembro no encontrado" },
          });
        }
        const willDegradeOwner =
          target.role === "OWNER" && req.body.role && req.body.role !== "OWNER";
        const willDeactivateOwner =
          target.role === "OWNER" && req.body.isActive === false;
        // Atomización del check LAST_OWNER: dos requests degradando OWNERs
        // distintos a la vez pueden hacer pass de su count individual y
        // dejarnos sin OWNERs. Lo metemos en una transacción SERIALIZABLE
        // que aborta si hay conflicto.
        try {
          const updated = await prisma.$transaction(
            async (tx) => {
              if (willDegradeOwner || willDeactivateOwner) {
                const ownerCount = await tx.user.count({
                  where: { role: "OWNER", isActive: true },
                });
                if (ownerCount <= 1) {
                  throw new Error("LAST_OWNER");
                }
              }
              return tx.user.update({
                where: { id: target.id },
                data: {
                  role: req.body.role,
                  isActive: req.body.isActive,
                  name: req.body.name?.trim(),
                  phone: req.body.phone === undefined ? undefined : req.body.phone,
                },
                include: { barberProfile: { select: { id: true } } },
              });
            },
            { isolationLevel: "Serializable" },
          );
          return toDto(updated);
        } catch (err) {
          if (err instanceof Error && err.message === "LAST_OWNER") {
            return reply.status(400).send({
              error: {
                code: "LAST_OWNER",
                message: "Debe quedar al menos un OWNER activo",
              },
            });
          }
          throw err;
        }
      },
    );
  };
}
