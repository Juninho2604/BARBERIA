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
- **Infra:** VPS del usuario (Docker: Postgres + API Fastify, Nginx + Let's Encrypt en host). Next.js en Vercel **provisionalmente** — cuando llegue el dominio, el frontend se migra al VPS y Vercel sale de la ecuación (todo mismo origen, sin CORS cross-domain, sin tunnel separado).
- **Metodología:** pair programming. Yo guío, el usuario ejecuta en su VPS. Nunca empujamos cambios destructivos sin confirmar.

Documento maestro de arquitectura: [`docs/PLAN.md`](docs/PLAN.md).

---

## 2. Estado actual

- **Fecha última actualización:** 2026-05-28
- **Rama activa:** `claude/quirky-ride-pD2AK`
- **Hito actual:** **M4 cerrado + M6 en curso.** Backend completo (auth, services, barbers, availability, appointments, time-off admin). Frontend: nueva ruta `/reservar` con flujo en 4 pasos (servicio → barbero → fecha+slot → datos contacto). API client (`apps/web/src/lib/api.ts`) tipado con `@barberia/shared`; si `NEXT_PUBLIC_API_URL` no está definido cae a mocks (`lib/mock.ts`) — esto deja la UI visible en Vercel mientras la API del VPS sigue privada.
- **M2 cerrado:** API Fastify corriendo en el VPS dentro de Docker, Postgres saludable, migraciones automáticas vía `prisma migrate deploy` en el entrypoint.
- **M1 pausado:** clave SSH ya está en `authorized_keys` del VPS. **Fail2ban ✅ instalado y activo** (jail `sshd` enabled, ya baneando IPs de fuerza bruta). Pendiente: deshabilitar password auth, crear usuario non-root, UFW. **Nota:** kernel pendiente de upgrade en el VPS (`6.8.0-110` → `6.8.0-117`); requiere `reboot` en ventana tranquila (Docker levanta solo con `restart: unless-stopped`).
- **Exposición de la API:** el usuario decidió **esperar a tener dominio (un par de días)**. Cuando llegue, **Vercel sale**: frontend se migra al VPS, Nginx hace reverse proxy a la API en el mismo origen, Let's Encrypt para HTTPS. Hasta entonces, la API sólo es accesible desde el propio VPS (`127.0.0.1:4000`); desarrollamos backend y se prueba con curl vía SSH.
- **Siguiente acción:** cuando llegue el dominio: mover web al VPS, exponer API por Nginx, definir `NEXT_PUBLIC_API_URL` y la UI deja de usar mocks. Mientras tanto se puede pulir copy/diseño o arrancar M7 (panel admin).
- **Modelo de desarrollo (importante):** el usuario NO desarrolla en local. Yo escribo código en este entorno remoto y pusheo a GitHub. Frontend autodeploy en Vercel. Backend/DB se despliegan en el VPS vía `docker compose` cuando llegue el momento. La Mac del usuario sólo se usa para chat + SSH al VPS.
- **Bloqueadores:** ninguno.
- **Intro 3D:** `BarberIntro` ahora carga un modelo real `apps/web/public/models/barber-chair.glb` (3.7 MB, export Sketchfab OBJ→glTF, materiales PBR Leather/Metal/Plastic con baseColor+metallic-roughness+normal, sin Draco) en lugar de la silla procedural. Se reorienta Z-up→Y-up, se recentra y escala a altura objetivo, y el anillo muestra primero la descarga del .glb y luego el giro. **Modelo comprado por el usuario** → sin obligación de atribución (licencia de pago, no CC-BY).

### Progreso por hito
| Hito | Estado |
|---|---|
| M0 — Prerrequisitos VPS/dominio | ✅ Cerrado (sin dominio aún → estrategia Cloudflare Tunnel) |
| M1 — Provisioning VPS + TLS | ⏸️ Pausado (clave SSH instalada + Fail2ban ✅ activo; pendiente: password auth off, usuario non-root, UFW) |
| M2 — Esqueleto backend (Fastify+Prisma) | ✅ Cerrado (corriendo en el VPS) |
| M3 — Auth + Servicios + Barberos | ✅ Cerrado |
| M4 — Disponibilidad + Reservas | ✅ Cerrado |
| M5 — Next.js + Vercel + design tokens | ✅ Cerrado |
| M6 — Flujo público de reserva | En curso (M6.1 ✅ flujo de 4 pasos con mocks; pendiente conectar API real cuando llegue el dominio) |
| M7 — Panel admin | En curso (M7.1 ✅ login + CRUD básico, M7.2 ✅ editor de horario semanal + TimeOff; pendiente: edición de servicio existente) |
| M8 — Backups + monitoring | En curso (M8.1 ✅ script de backup + restore + healthcheck del API; pendiente: instalar cron en el VPS y M1 hardening) |

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

- **2026-05-28** — **Intro 3D / modelo real.** El usuario subió un `.glb` de silla de barbero (3.7 MB, export Sketchfab OBJ→glTF, materiales PBR Leather/Metal/Plastic con baseColor+metallic-roughness+normal, sin Draco). Guardado en `apps/web/public/models/barber-chair.glb`. Reescrito `BarberIntro.tsx`: sustituye la silla procedural por carga del GLB con `GLTFLoader`. El modelo viene Z-up y en unidades ~1000 → se reorienta a Y-up (`rotation.x = -PI/2`), se recentra con `Box3` y se escala a altura objetivo (3 u). RoomEnvironment (PMREM) alimenta los reflejos del cromo; `envMapIntensity` realzado en todos los materiales; sombras PCF + shadowCatcher reposicionado bajo el modelo. El anillo de progreso muestra primero la descarga del .glb (onProgress) y, una vez listo, el avance del giro (gate `ready`). Disposición correcta de geometrías/materiales/texturas al desmontar. Typecheck + build ✅. **Modelo comprado** → sin atribución requerida.
- **2026-05-28** — **M1 / Fail2ban en el VPS.** Instalado `fail2ban` (jail `sshd` por defecto), `systemctl enable --now`. Verificado: ya está baneando IPs de fuerza bruta SSH (8 baneadas, 84 intentos fallidos en el primer chequeo) — confirma el bombardeo habitual a `root@22`. **Pendiente M1:** deshabilitar password auth en SSH, crear usuario non-root con sudo, UFW. **Aviso del VPS:** kernel pendiente de upgrade (`6.8.0-110` → `6.8.0-117`); programar `reboot` en ventana tranquila (los contenedores levantan solos por `restart: unless-stopped`).
- **2026-05-28** — **M8.1 / backups + healthcheck.** `infra/scripts/backup.sh`: vuelca Postgres con `docker exec ... pg_dump`, comprime con gzip, guarda en `/opt/barberia/backups/` y rota >14 días con `find -mtime`. `infra/scripts/restore.sh`: pide confirmación interactiva, hace `DROP SCHEMA public CASCADE`, restaura desde gz y reinicia el contenedor API. Healthcheck del API añadido en `docker-compose.yml` (usa `fetch` nativo de Node 20). `.gitignore`: excluye `backups/` para que el volcado en el VPS no se confunda con código. **M6.2 (emails) descartado para v1** — el usuario prefiere no pagar/configurar Resend hasta más adelante.
- **2026-05-28** — **M7.2 / editor por barbero.** Nueva ruta `/admin/barbers/[id]` con dos secciones: (1) editor de horario semanal — checkbox por día + inputs `time` start/end; valida `endMin > startMin` por día; guarda con `PUT /barbers/:id/working-hours`. (2) TimeOff list+create+delete: lista permisos futuros (filtro `endsAt > now`); form con `datetime-local` para inicio/fin + motivo opcional; valida `endsAt > startsAt`. API client extendido con `getBarber` y `setBarberWorkingHours`; mocks análogos. Link "Editar" añadido en la lista de `/admin/barbers`. Build ✅.
- **2026-05-28** — **M7.1 / panel admin (scaffold).** Login en `/login`, panel en `/admin` (resumen, servicios, barberos, citas). Auth en cliente con `localStorage` (token + user en JSON, helpers en `lib/auth-client.ts`); `AdminLayout` verifica role=ADMIN llamando `/auth/me` y redirige a `/login` si falla. CRUD servicios: tabla + alta inline + soft-delete. Barberos: tarjetas con bio y horarios; alta crea User+Barber con horario L–V 9–17 por defecto. Citas: tabla ordenada por fecha con cancelar inline. Cliente API extendido con todos los endpoints admin (`adminListServices`, `createService`, `updateService`, `deleteService`, `adminListBarbers`, `createBarber`, `deleteBarber`, `adminListAppointments`, `cancelAppointment`, time-off). Mocks reflejan el mismo shape — en demo, login acepta cualquier credencial y devuelve role ADMIN; los cambios persisten en memoria del navegador. Fix lateral: `useSearchParams` en `/login` requería Suspense boundary en Next 15 (lo envolví). Build verificado ✅.
- **2026-05-28** — **M6.1 / flujo de reserva en frontend.** Nueva ruta `/reservar` con componente cliente `BookingFlow` (4 pasos: servicio → barbero → fecha+slot → datos contacto → confirmación). API client tipado (`apps/web/src/lib/api.ts`) consume `@barberia/shared` para tipos; si `NEXT_PUBLIC_API_URL` está vacío usa `lib/mock.ts` (cataálogo + barberos + slots generados al vuelo). Esto deja la UI visible en Vercel ahora y se vuelve real cuando llegue el dominio + variable de entorno. La landing (`/`) también consume el catálogo vía API (con fallback). Build verificado ✅.
- **2026-05-28** — **M4.2.** TimeOff admin: `GET /barbers/:id/time-off` (público para verificación), `POST /barbers/:id/time-off` y `DELETE /time-off/:id` (ADMIN). Schema `CreateTimeOff` con refine `endsAt > startsAt`. Schemas en `packages/shared`.
- **2026-05-28** — **M4.1.** Disponibilidad y reservas. `GET /barbers/:id/availability?serviceId=&date=YYYY-MM-DD` calcula slots libres en la TZ configurada (`DEFAULT_TIMEZONE`, default `America/Caracas`). Algoritmo (`lib/availability.ts`): para cada `WorkingHour` del weekday, itera en pasos de `SLOT_GRANULARITY_MINUTES`, descarta slots que solapen `TimeOff` o `Appointment` activas, descarta los que ya pasaron. `POST /appointments` permite reserva con sesión (usa `req.auth.userId`) o como guest (crea User CLIENT sin password — reclamable luego con register). Concurrencia: re-chequeo de solapamiento dentro de `$transaction` antes del INSERT, devuelve `409 SLOT_TAKEN` o `409 BARBER_UNAVAILABLE`. `GET /appointments` filtra por rol: CLIENT ve los suyos, BARBER los suyos como barbero, ADMIN todos (con filtro opcional `?barberId=`). `PATCH /:id/cancel` permite cancelar al cliente dueño, al barbero asignado, o a admin. Helpers de tz con `luxon` (`utcAtLocalMinutes`, `weekdayInTz`, `startOfDayUtc`). Schemas (`Availability*`, `Appointment`, `Guest`) en `packages/shared`.
- **2026-05-28** — **M3.3 / M3 cerrado.** CRUD de servicios y barberos. `/services` y `/services/:id` públicos (filtran `isActive=true` salvo `?includeInactive=true`). `POST/PUT/DELETE /services` protegidos con `requireRole("ADMIN")`; `DELETE` es soft-delete (`isActive=false`) para no romper appointments. Barberos análogos en `/barbers`: lectura pública (proyectada con datos del User asociado), mutación admin. `POST /barbers` crea User (rol BARBER, sin password — reclamable luego) + Barber + working hours opcionales, todo en transacción. `PUT /barbers/:id/working-hours` reemplaza la semana entera. Validación con Zod + soft-delete consistente. Schemas (`Service*`/`Barber*`/`WorkingHour*`) en `packages/shared`. **Para bootstrap del primer admin:** `docker compose exec db psql -U postgres -d barberia -c "UPDATE \"User\" SET role='ADMIN' WHERE email='<tu-email>';"` (no hay seed automático todavía).
- **2026-05-28** — **M3.2 hecho.** Auth completo en la API. Endpoints: `POST /auth/register` (crea User CLIENT; si existe un User sin `passwordHash` — creado por reserva sin registro — lo reclama), `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me` (protegido). JWT con `jose` (HS256, issuer `barberia-api`, TTL configurable). Hash con `bcryptjs` (12 rounds, pure JS — evita compilar nativo en el contenedor). Middleware `requireAuth` + `requireRole` expuesto vía factory `makeAuthGuards(env)`. Schemas (`Login`/`Register`/`Refresh`/`AuthSession`) en `packages/shared`. Errores de validación Zod devuelven 400 con `code: VALIDATION_ERROR`. **Fix lateral importante:** `@barberia/shared` exportaba `.ts` directo, lo que funciona en compile pero rompe en runtime de Node (`node dist/index.js` no lee TypeScript). Ahora se compila a `dist/`, `exports` apuntan a JS, y el Dockerfile + Vercel buildCommand construyen `shared` antes que su consumidor. Web y API typecheckean y buildan ✅.
- **2026-05-28** — **M3.1 hecho.** Primera migración Prisma generada offline con `prisma migrate diff --from-empty` (no necesitamos una DB local, el SQL se escribe a mano y `migrate deploy` lo aplicará en el VPS al siguiente despliegue). Archivos: `apps/api/prisma/migrations/20260528120000_init/migration.sql` + `migration_lock.toml`. `PrismaClient` singleton en `apps/api/src/db.ts`, instanciado en `index.ts` con shutdown limpio (`$disconnect`). Nuevo endpoint `/health/ready` que hace `SELECT 1` contra Postgres (devuelve 503 si falla) — útil para healthcheck del contenedor y para diagnóstico desde el VPS. Build + typecheck verificados ✅.
- **2026-05-28** — Decisión: cuando llegue el dominio (~días), **Vercel sale de la ecuación**. Frontend se moverá al VPS, Nginx hará reverse proxy de `/api/*` → API en el mismo origen. Esto elimina CORS cross-domain, evita el tunnel y simplifica secretos (todo en el VPS).
- **2026-05-28** — **M2 cerrado.** API corriendo en el VPS dentro de Docker. Postgres saludable, migraciones aplicadas (cero hasta ahora — schema sin cambios desde la primera versión), API escuchando en `127.0.0.1:4000` del VPS. Healthcheck `/health` operativo. El fix de Debian funcionó pero requería rebuild sin cache para descartar layers stale.
- **2026-05-28** — Cambio de imagen base de Alpine a Debian: incluso con `apk add openssl`, Prisma seguía sin detectar libssl en `node:20-alpine`. Migrado a `node:20-bookworm-slim` (Debian) que tiene libssl3 nativa y no requiere debug. `binaryTargets` ajustado a `debian-openssl-3.0.x`. — `148f9ae`
- **2026-05-28** — Intento fallido de fix Alpine: añadido `apk add --no-cache openssl` y `binaryTargets = linux-musl-openssl-3.0.x` en `schema.prisma`. Prisma seguía con error "failed to detect libssl/openssl version". — `7d1e2e6`
- **2026-05-28** — Fix build de la API: `server.ts` tipa `err` como `FastifyError` en el error handler (TS strict lo veía como `unknown`). Dockerfile cambia `pnpm --filter @barberia/api prisma generate` por `pnpm --filter @barberia/api exec prisma generate` (no había script "prisma" en package.json). Build verificado ✅. — `0f5573b`
- **2026-05-28** — Pipeline GitHub → VPS para el backend. Añadido `.github/workflows/deploy-api.yml` (SSH al VPS con `appleboy/ssh-action`, `git reset --hard` + `docker compose up -d --build`, healthcheck `/health`). `infra/scripts/vps-bootstrap.sh` automatiza instalación de Docker, clone, generación de `.env` con secretos aleatorios y creación de SSH key dedicada. `infra/docker-compose.yml` actualizado con servicio `api` + interpolación desde `.env` (postgres ya no expone puerto al host, solo red interna). `apps/api/Dockerfile` corre `prisma migrate deploy` antes de arrancar (vía `docker-entrypoint.sh`). — `67ac315`
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
