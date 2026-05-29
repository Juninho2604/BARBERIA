import type { FastifyPluginAsync } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import type { Prisma, Role } from "@prisma/client";
import {
  InviteStaffSchema,
  UpdateStaffSchema,
  STAFF_ROLES,
  type StaffMember as StaffMemberDto,
} from "@barberia/shared";
import { prisma } from "../db.js";
import type { AuthGuards } from "../auth/middleware.js";

const IdParam = z.object({ id: z.string().min(1) });

// Roles que cuentan como staff (todo lo que no es CLIENT puro). ADMIN incluido
// como alias legacy → se trata como OWNER.
const STAFF_ROLE_LIST: Role[] = [...STAFF_ROLES];

const STAFF_INCLUDE = {
  barberProfile: { select: { id: true } },
} satisfies Prisma.UserInclude;

type StaffUser = Prisma.UserGetPayload<{ include: typeof STAFF_INCLUDE }>;

function toDto(u: StaffUser): StaffMemberDto {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    role: u.role,
    isActive: u.isActive,
    barberId: u.barberProfile?.id ?? null,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
  };
}

/** Cuenta OWNERs activos (ADMIN legacy cuenta como OWNER). */
async function activeOwnerCount(tx: Prisma.TransactionClient): Promise<number> {
  return tx.user.count({
    where: { role: { in: ["OWNER", "ADMIN"] }, isActive: true },
  });
}

export function staffRoutes(guards: AuthGuards): FastifyPluginAsync {
  return async (app) => {
    const r = app.withTypeProvider<ZodTypeProvider>();

    // GET / — listar miembros del staff.
    r.get(
      "/",
      { preHandler: [guards.requireAuth, guards.requireAction("staff.manage")] },
      async () => {
        const users = await prisma.user.findMany({
          where: { role: { in: STAFF_ROLE_LIST } },
          include: STAFF_INCLUDE,
          orderBy: [{ role: "asc" }, { name: "asc" }],
        });
        return users.map(toDto);
      },
    );

    // POST /invite — alta de un miembro. Crea el User sin contraseña; se
    // reclama luego vía /auth/register con el mismo email. Si el rol es BARBER
    // se le crea (o vincula) un perfil Barber para que aparezca en agenda.
    r.post(
      "/invite",
      {
        preHandler: [guards.requireAuth, guards.requireAction("staff.manage")],
        schema: { body: InviteStaffSchema },
      },
      async (req, reply) => {
        const { email, name, role, barberId } = req.body;
        const normalizedEmail = email.toLowerCase();

        const existing = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });
        if (existing) {
          return reply.status(409).send({
            error: { code: "EMAIL_TAKEN", message: "Ya existe un usuario con ese email" },
          });
        }

        try {
          const userId = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
              data: { email: normalizedEmail, name: name.trim(), role },
            });

            if (role === "BARBER") {
              if (barberId) {
                // Vincular a un perfil Barber existente: solo si su User actual
                // es un placeholder sin login (creado por POST /barbers) y sin
                // historial — reasignamos el perfil al nuevo staff y borramos
                // el placeholder. Si tiene login o citas, no lo tocamos.
                const barber = await tx.barber.findUnique({
                  where: { id: barberId },
                  include: {
                    user: { select: { id: true, passwordHash: true } },
                    _count: { select: { appointments: true } },
                  },
                });
                if (!barber) throw new Error("BARBER_NOT_FOUND");
                if (barber.user.passwordHash || barber._count.appointments > 0) {
                  throw new Error("BARBER_NOT_LINKABLE");
                }
                await tx.barber.update({
                  where: { id: barber.id },
                  data: { userId: user.id },
                });
                await tx.user.delete({ where: { id: barber.user.id } });
              } else {
                // Sin vínculo: perfil Barber nuevo y vacío.
                await tx.barber.create({ data: { userId: user.id } });
              }
            }

            return user.id;
          });

          const fresh = await prisma.user.findUniqueOrThrow({
            where: { id: userId },
            include: STAFF_INCLUDE,
          });
          return reply.status(201).send(toDto(fresh));
        } catch (err) {
          if (err instanceof Error && err.message === "BARBER_NOT_FOUND") {
            return reply.status(404).send({
              error: { code: "NOT_FOUND", message: "Barbero a vincular no encontrado" },
            });
          }
          if (err instanceof Error && err.message === "BARBER_NOT_LINKABLE") {
            return reply.status(409).send({
              error: {
                code: "BARBER_NOT_LINKABLE",
                message: "Ese barbero ya tiene cuenta o historial; no se puede vincular",
              },
            });
          }
          throw err;
        }
      },
    );

    // PATCH /:id — cambiar rol, activar/desactivar, editar nombre/teléfono.
    r.patch(
      "/:id",
      {
        preHandler: [guards.requireAuth, guards.requireAction("staff.manage")],
        schema: { params: IdParam, body: UpdateStaffSchema },
      },
      async (req, reply) => {
        const { role, isActive, name, phone } = req.body;

        const target = await prisma.user.findUnique({
          where: { id: req.params.id },
          include: STAFF_INCLUDE,
        });
        if (!target || !STAFF_ROLE_LIST.includes(target.role)) {
          return reply.status(404).send({
            error: { code: "NOT_FOUND", message: "Miembro no encontrado" },
          });
        }

        const isOwner = target.role === "OWNER" || target.role === "ADMIN";
        const losingOwner =
          isOwner && ((role !== undefined && role !== "OWNER") || isActive === false);

        try {
          const updated = await prisma.$transaction(async (tx) => {
            // Nunca dejar el local sin un OWNER activo.
            if (losingOwner && (await activeOwnerCount(tx)) <= 1) {
              throw new Error("LAST_OWNER");
            }
            return tx.user.update({
              where: { id: target.id },
              data: {
                ...(role !== undefined ? { role } : {}),
                ...(isActive !== undefined ? { isActive } : {}),
                ...(name !== undefined ? { name: name.trim() } : {}),
                ...(phone !== undefined ? { phone } : {}),
              },
              include: STAFF_INCLUDE,
            });
          });
          return toDto(updated);
        } catch (err) {
          if (err instanceof Error && err.message === "LAST_OWNER") {
            return reply.status(400).send({
              error: { code: "LAST_OWNER", message: "Debe haber al menos un OWNER activo" },
            });
          }
          throw err;
        }
      },
    );
  };
}
