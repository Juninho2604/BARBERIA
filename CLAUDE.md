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
- **Hito actual:** **M1 — Provisioning VPS** (M0 cerrado: prerrequisitos confirmados)
- **Siguiente acción:** ejecutar `ssh-copy-id root@147.93.6.70` para subir la clave pública al VPS y validar login sin contraseña.
- **Bloqueadores:** ninguno.

### Progreso por hito
| Hito | Estado |
|---|---|
| M0 — Prerrequisitos VPS/dominio | ✅ Cerrado (sin dominio aún → estrategia Cloudflare Tunnel) |
| M1 — Provisioning VPS + TLS | En curso |
| M2 — Esqueleto backend (Fastify+Prisma) | Pendiente |
| M3 — Auth + Servicios + Barberos | Pendiente |
| M4 — Disponibilidad + Reservas | Pendiente |
| M5 — Next.js + Vercel + design tokens | Pendiente |
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

- **2026-05-28** — M1 iniciado. Clave SSH ed25519 generada en la máquina del usuario (`~/.ssh/id_ed25519`). Datos del VPS registrados: `147.93.6.70`, user `root`, puerto 22. Siguiente: `ssh-copy-id` para autenticación sin contraseña. — _este commit_
- **2026-05-27** — Cerrado M0. Cerradas 6 decisiones abiertas con defaults + UTC-4 del usuario. Cambio de estrategia: **sin dominio aún → Cloudflare Tunnel** para exponer la API; Let's Encrypt se difiere hasta que haya dominio. M1 arranca con generación de clave SSH del usuario. — `2bb9448`
- **2026-05-27** — Añadido `CLAUDE.md` como fuente de contexto vivo. Definida disciplina de actualización por commit. — `6fa0050`
- **2026-05-27** — Plan inicial aprobado por el usuario ("lo veo bien").
- **2026-05-27** — Commit inicial: `docs/PLAN.md` con arquitectura, roadmap M0–M8, schema Prisma, estructura API, prerrequisitos VPS. — `a3bbf7e`
