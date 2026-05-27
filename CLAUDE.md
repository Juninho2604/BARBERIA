# CLAUDE.md — Contexto de sesión

> **Para Claude (yo mismo en futuras sesiones):** este archivo es la fuente de
> verdad del estado del proyecto. Léelo al inicio de cada sesión.
> **Regla obligatoria:** después de cualquier cambio significativo (commit,
> decisión técnica, hito alcanzado, bloqueador encontrado) **actualiza este
> archivo en el mismo commit** — sección *Estado actual* + entrada nueva en
> *Log de cambios*. Si olvido hacerlo, el usuario puede recordármelo con
> "actualiza el contexto".

---

## 1. Resumen del proyecto

Plataforma integral para una barbería:
- **Landing pública** + **panel de administración**.
- **Reservas online** con agenda por barbero, CRUD de servicios y usuarios.
- **Infra:** VPS del usuario (Docker: Postgres + API Fastify, Nginx + Let's Encrypt en host). Next.js en Vercel.
- **Metodología:** pair programming. Yo guío, el usuario ejecuta en su VPS. Nunca empujamos cambios destructivos sin confirmar.

Documento maestro de arquitectura: [`docs/PLAN.md`](docs/PLAN.md).

---

## 2. Estado actual

- **Fecha última actualización:** 2026-05-27
- **Rama activa:** `claude/quirky-ride-pD2AK`
- **Hito actual:** **M0 — Prerrequisitos** (a la espera de inputs del usuario)
- **Siguiente acción:** recibir del usuario VPS IP, dominio, clave SSH pública, email para Let's Encrypt → comenzar M1 (provisioning).
- **Bloqueadores:** ninguno técnico. Esperando approval de las 6 decisiones abiertas (ver §4) — no bloquean M0/M1 pero **sí** bloquean M2.

### Progreso por hito
| Hito | Estado |
|---|---|
| M0 — Prerrequisitos VPS/dominio | En curso |
| M1 — Provisioning VPS + TLS | Pendiente |
| M2 — Esqueleto backend (Fastify+Prisma) | Pendiente |
| M3 — Auth + Servicios + Barberos | Pendiente |
| M4 — Disponibilidad + Reservas | Pendiente |
| M5 — Next.js + Vercel + design tokens | Pendiente |
| M6 — Flujo público de reserva | Pendiente |
| M7 — Panel admin | Pendiente |
| M8 — Backups + monitoring | Pendiente |

---

## 3. Decisiones tomadas (cerradas)

- **Stack VPS:** Ubuntu 22.04, Docker + Compose, PostgreSQL 16, Node 20 + Fastify + Prisma + Zod, Nginx en host + Certbot, UFW + Fail2ban.
- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind v4 con CSS variables + `theme.config.ts` como única fuente de design tokens.
- **Auth:** JWT (access + refresh) + bcrypt. Sin proveedores externos en v1.
- **Repo:** monorepo con **pnpm workspaces** (`apps/api`, `apps/web`, `packages/shared`, `infra/`).
- **Dinero:** se guarda en `Int` como céntimos (`priceCents`).
- **Convención de commits:** `tipo: descripción` (`feat:`, `fix:`, `docs:`, `chore:`, `infra:`). En español cuando aporte claridad.
- **Branch policy:** desarrollo en `claude/quirky-ride-pD2AK` mientras dure el setup. Tras M2 abriremos `main` como protegida y trabajaremos por feature branches.
- **Disciplina de contexto:** este archivo (`CLAUDE.md`) se actualiza con cada cambio significativo, en el mismo commit.

---

## 4. Decisiones abiertas (pendientes de respuesta del usuario)

Bloquean M2 en adelante. Detalle en `docs/PLAN.md §7`.

1. **Zona horaria** — propuesta: guardar todo en UTC, convertir en cliente.
2. **Granularidad de slots** — 15 o 30 min.
3. **Modelo:** un barbero o múltiples barberos.
4. **Reserva sin registro** — permitir reservar dando sólo email/teléfono (crea `User` shadow).
5. **Notificaciones** — email (Resend) v1; SMS/WhatsApp más adelante.
6. **Pagos** — fuera de alcance v1, pero `priceCents` ya preparado.

---

## 5. Datos del entorno del usuario

Se rellena en M0. **No se guardan secretos aquí**, sólo referencias.

- **VPS IP:** _pendiente_
- **Dominio raíz:** _pendiente_
- **Subdominio API:** `api.<dominio>` — _pendiente_
- **Usuario SSH inicial:** _pendiente_ (típicamente `root`, lo migraremos a un usuario non-root en M1)
- **Email Let's Encrypt:** _pendiente_
- **Repo GitHub:** `juninho2604/barberia`
- **Cuenta Vercel:** _pendiente confirmar_
- **Proveedor email (M6+):** _pendiente decidir_

---

## 6. Convenciones técnicas

### Comandos / flujos
- **Deploy backend en VPS:** `git pull && docker compose -f infra/docker-compose.yml up -d --build api` (provisional hasta CI).
- **Migraciones:** `pnpm --filter api prisma migrate deploy` dentro del contenedor.
- **Backup manual:** `infra/scripts/backup.sh` (se crea en M8).

### Seguridad
- Nunca commitear `.env`. Sólo `.env.example`.
- Secretos del backend viven en el VPS (`/opt/barberia/.env`, root-only).
- Secretos del frontend viven en el dashboard de Vercel.
- JWT secret rotable; documentar procedimiento en M8.

### Estilo de código
- TypeScript strict en todo.
- Validación con Zod en cada borde (request body, query, params).
- Errores HTTP estandarizados: `{ error: { code, message } }`.

---

## 7. Cómo retomar contexto (para sesiones nuevas)

1. Leer este archivo entero.
2. Revisar `docs/PLAN.md` si hay duda arquitectónica.
3. `git log --oneline -20` para ver los últimos commits.
4. Confirmar con el usuario el hito en curso antes de tocar nada en el VPS.

---

## 8. Log de cambios

Entradas en orden cronológico inverso. Formato: `YYYY-MM-DD — descripción — commit`.

- **2026-05-27** — Añadido `CLAUDE.md` como fuente de contexto vivo. Definida disciplina de actualización por commit. — _este commit_
- **2026-05-27** — Plan inicial aprobado por el usuario ("lo veo bien"). Pendiente input de prerrequisitos para arrancar M0/M1.
- **2026-05-27** — Commit inicial: `docs/PLAN.md` con arquitectura, roadmap M0–M8, schema Prisma, estructura API, prerrequisitos VPS. — `a3bbf7e`
