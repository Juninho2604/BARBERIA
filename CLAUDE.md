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

- **Fecha última actualización:** 2026-05-28
- **Rama activa:** `claude/quirky-ride-pD2AK`
- **Hito actual:** **M2 + M5 en paralelo** — esqueleto backend (Fastify + Prisma) y frontend (Next.js + Tailwind + design tokens). El usuario priorizó construir producto sobre ops.
- **M1 pausado:** clave SSH ya está en `authorized_keys` del VPS (`ssh-copy-id` funcionó). Hardening (deshabilitar password auth, crear usuario non-root, UFW, Fail2ban, Cloudflare Tunnel) se retoma cuando haya algo que desplegar.
- **Siguiente acción:** el usuario corre `vps-bootstrap.sh` en el VPS (instala Docker, clona repo, genera `.env` con secretos aleatorios, crea SSH key dedicada para GitHub Actions, hace primer build). Luego añade 4 secrets en GitHub (VPS_HOST, VPS_USER, VPS_PORT, VPS_SSH_KEY) y todos los siguientes pushes despliegan solos.
- **Modelo de desarrollo (importante):** el usuario NO desarrolla en local. Yo escribo código en este entorno remoto y pusheo a GitHub. Frontend autodeploy en Vercel. Backend/DB se despliegan en el VPS vía `docker compose` cuando llegue el momento. La Mac del usuario sólo se usa para chat + SSH al VPS.
- **Bloqueadores:** ninguno.

### Progreso por hito
| Hito | Estado |
|---|---|
| M0 — Prerrequisitos VPS/dominio | ✅ Cerrado (sin dominio aún → estrategia Cloudflare Tunnel) |
| M1 — Provisioning VPS + TLS | ⏸️ Pausado (clave SSH ya instalada en VPS) |
| M2 — Esqueleto backend (Fastify+Prisma) | En curso |
| M3 — Auth + Servicios + Barberos | Pendiente |
| M4 — Disponibilidad + Reservas | Pendiente |
| M5 — Next.js + Vercel + design tokens | En curso (en paralelo con M2) |
| M6 — Flujo público de reserva | Pendiente |
| M7 — Panel admin | Pendiente |
| M8 — Backups + monitoring | Pendiente |

---

## 3. Decisiones tomadas (cerradas)

- **Stack VPS:** Ubuntu 24.04, Docker + Compose, PostgreSQL 16, Node 20 + Fastify + Prisma + Zod, Nginx en host, UFW + Fail2ban.
- **TLS / exposición de la API (sin dominio):** **Cloudflare Tunnel** (`cloudflared`) genera URL HTTPS pública sin abrir puertos del VPS, sin dominio propio. Cuando el usuario compre dominio (Cloudflare DNS), se sustituye el hostname del tunnel — el resto de infra no cambia. Certbot/Let's Encrypt se incorpora **sólo cuando haya dominio**.
- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind v4 con CSS variables + `theme.config.ts` como única fuente de design tokens. Hosting en Vercel desde el inicio.
- **Auth:** JWT (access + refresh) + bcrypt. Sin proveedores externos en v1.
- **Repo:** monorepo con **pnpm workspaces** (`apps/api`, `apps/web`, `packages/shared`, `infra/`).
- **Dinero:** se guarda en `Int` como céntimos (`priceCents`).
- **Zona horaria:** storage en UTC. Display en **UTC-4** (IANA tentativa `America/Caracas`, a confirmar). Configurable vía env `DEFAULT_TIMEZONE`.
- **Granularidad de slots:** 30 minutos.
- **Modelo de barberos:** multi-barbero desde el inicio.
- **Reserva sin registro:** permitida. El cliente sólo da email + teléfono + nombre; se crea un `User` con `passwordHash = null` y rol `CLIENT`. Si después se registra, se reclama la cuenta por email.
- **Notificaciones:** email vía Resend en M6. SMS/WhatsApp fuera de v1.
- **Pagos:** fuera de v1; `priceCents` queda preparado.
- **Convención de commits:** `tipo: descripción` (`feat:`, `fix:`, `docs:`, `chore:`, `infra:`). En español cuando aporte claridad.
- **Branch policy:** desarrollo en `claude/quirky-ride-pD2AK` mientras dure el setup. Tras M2 abriremos `main` como protegida y trabajaremos por feature branches.
- **Disciplina de contexto:** este archivo (`CLAUDE.md`) se actualiza con cada cambio significativo, en el mismo commit.

---

## 4. Decisiones abiertas

Ninguna que bloquee. El usuario delegó las 6 anteriores a defaults; quedan registradas como cerradas en §3.

Pendientes menores para resolver en su hito correspondiente:
- Confirmar IANA timezone exacta (M3) — actualmente tentativa `America/Caracas`.
- Decidir nombre del subdominio API cuando haya dominio (M8 o cuando se compre).

---

## 5. Datos del entorno del usuario

Se rellena durante M0–M1. **No se guardan secretos aquí**, sólo referencias.

- **VPS:** Ubuntu **24.04** LTS (hostname `vmi3133626`) en `147.93.6.70` — Hostinger. SSH puerto 22, usuario `root`. Clave ed25519 instalada en `authorized_keys`. Soporte LTS hasta 2029.
- **Dominio raíz:** _aún no comprado_. Estrategia provisional: Cloudflare Tunnel para exponer la API. Migración a dominio propio + Cloudflare DNS prevista cuando el usuario lo compre.
- **URL API provisional:** se generará en M1 (Cloudflare Tunnel, tipo `<random>.trycloudflare.com` o subdominio `*.cfargotunnel.com` con cuenta Cloudflare).
- **Usuario SSH:** actualmente `root` con contraseña. En M1 se crea usuario non-root con sudo + login por clave; se deshabilita login root y password auth.
- **Email para certificados:** N/A todavía (no hay dominio). Se rellena al comprarlo.
- **Repo GitHub:** `juninho2604/barberia`.
- **Email del usuario (contacto):** `omarmoya2604@gmail.com`.
- **Cuenta Vercel:** _pendiente confirmar_ en M5.
- **Proveedor email (M6+):** Resend (default).

---

## 6. Convenciones técnicas

### Comandos / flujos
- **Deploy backend en VPS:** automático vía GitHub Actions (`.github/workflows/deploy-api.yml`) en cada push a `claude/quirky-ride-pD2AK` o `main` que toque `apps/api/**`, `packages/shared/**`, `infra/**`, `pnpm-lock.yaml` o el propio workflow. SSH al VPS → `git reset --hard origin/<branch>` → `docker compose up -d --build` → healthcheck `/health`.
- **Bootstrap inicial del VPS:** `bash infra/scripts/vps-bootstrap.sh` (idempotente). Instala Docker, clona repo en `/opt/barberia`, genera `.env` con secretos aleatorios (`openssl rand`), crea clave SSH dedicada `~/.ssh/barberia_deploy` y la añade a `authorized_keys`. Al final imprime los valores que hay que pegar en GitHub Secrets.
- **Migraciones:** automáticas. Se aplican al arrancar el contenedor API vía `docker-entrypoint.sh` (`npx prisma migrate deploy` → `node dist/index.js`).
- **Deploy manual (emergencia):** desde el VPS, `cd /opt/barberia && git pull && docker compose --env-file .env -f infra/docker-compose.yml up -d --build`.
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

- **2026-05-28** — Pipeline GitHub → VPS para el backend. Añadido `.github/workflows/deploy-api.yml` (SSH al VPS con `appleboy/ssh-action`, `git reset --hard` + `docker compose up -d --build`, healthcheck `/health`). `infra/scripts/vps-bootstrap.sh` automatiza instalación de Docker, clone, generación de `.env` con secretos aleatorios y creación de SSH key dedicada. `infra/docker-compose.yml` actualizado con servicio `api` + interpolación desde `.env` (postgres ya no expone puerto al host, solo red interna). `apps/api/Dockerfile` corre `prisma migrate deploy` antes de arrancar (vía `docker-entrypoint.sh`). — _este commit_
- **2026-05-28** — Commiteado `pnpm-lock.yaml` y cambiado vercel install a `--frozen-lockfile`. El lockfile evita la fase de fetch de metadata del registry, que era donde el bug `ERR_INVALID_THIS` de pnpm/undici (versión vieja de Node en Vercel) hacía fallar el deploy. Vercel deploy ✅. — `8bd2b92`
- **2026-05-28** — `apps/web/package.json`: añadido `packageManager: pnpm@9.12.0` y `engines.node: >=20`. Subidas deps a estables: React 19, Tailwind 4, @types/react 19. — `858347c`
- **2026-05-28** — `vercel.json` reubicado a `apps/web/vercel.json` (compatible con el setup donde Vercel tiene Root Directory = `apps/web`). Mantiene install/build filtrados a `@barberia/web...` para no traer deps del backend. — `5c3b812`
- **2026-05-28** — Scaffold del monorepo completo. Estructura pnpm con `apps/api` (Fastify + Prisma + Zod, schema con User/Barber/Service/WorkingHour/TimeOff/Appointment, Dockerfile multi-stage, healthcheck `/health`), `apps/web` (Next.js 15 + Tailwind v4 con design tokens centralizados en `globals.css @theme` + `theme/tokens.ts` como puente JS, landing con hero/services/footer), `packages/shared` (Zod schemas), `infra/docker-compose.yml` (Postgres 16). — `4b85371`
- **2026-05-28** — Pivote: el usuario prioriza construcción del producto y aclara que NO desarrolla en local; todo el código vive en GitHub, frontend en Vercel, backend en VPS. Saltamos a M2+M5 en paralelo. M1 pausado con clave SSH ya en `authorized_keys` del VPS.
- **2026-05-28** — M1 iniciado. Clave SSH ed25519 generada en la máquina del usuario (`~/.ssh/id_ed25519`) y copiada al VPS vía ssh-copy-id. Datos del VPS registrados: `147.93.6.70`, user `root`, puerto 22. — `152ab04`
- **2026-05-27** — Cerrado M0. Cerradas 6 decisiones abiertas con defaults + UTC-4 del usuario. Cambio de estrategia: **sin dominio aún → Cloudflare Tunnel** para exponer la API; Let's Encrypt se difiere hasta que haya dominio. M1 arranca con generación de clave SSH del usuario. — `2bb9448`
- **2026-05-27** — Añadido `CLAUDE.md` como fuente de contexto vivo. Definida disciplina de actualización por commit. — `6fa0050`
- **2026-05-27** — Plan inicial aprobado por el usuario ("lo veo bien").
- **2026-05-27** — Commit inicial: `docs/PLAN.md` con arquitectura, roadmap M0–M8, schema Prisma, estructura API, prerrequisitos VPS. — `a3bbf7e`
