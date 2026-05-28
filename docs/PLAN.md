# Plataforma Barbería — Plan de Implementación

> Documento de planificación previo al código. Pensado para iterarse en PRs.
> Metodología: **pair programming** — yo propongo, validamos juntos, ejecutamos
> paso a paso en tu VPS + Vercel.

---

## 0. Visión general de la arquitectura

```
                    ┌─────────────────────────┐
                    │       Usuarios          │
                    │  (clientes / admin)     │
                    └────────────┬────────────┘
                                 │ HTTPS
                  ┌──────────────┴───────────────┐
                  │                              │
        ┌─────────▼──────────┐         ┌─────────▼──────────┐
        │ Vercel (Next.js)   │         │ Vercel (Next.js)   │
        │ Landing pública    │         │ Panel admin (/app) │
        └─────────┬──────────┘         └─────────┬──────────┘
                  │                              │
                  └──────────────┬───────────────┘
                                 │ HTTPS (api.tudominio.com)
                    ┌────────────▼────────────┐
                    │   VPS (Ubuntu 24.04)    │
                    │  ┌───────────────────┐  │
                    │  │ Nginx (TLS 443)   │  │  ← Let's Encrypt
                    │  └─────────┬─────────┘  │
                    │            │ :3000      │
                    │  ┌─────────▼─────────┐  │
                    │  │ Docker network    │  │
                    │  │  ┌─────────────┐  │  │
                    │  │  │ API Fastify │  │  │
                    │  │  └──────┬──────┘  │  │
                    │  │         │ :5432   │  │
                    │  │  ┌──────▼──────┐  │  │
                    │  │  │ PostgreSQL  │  │  │  ← volumen + backups
                    │  │  └─────────────┘  │  │
                    │  └───────────────────┘  │
                    └─────────────────────────┘
```

Decisiones clave:
- **PostgreSQL y API en Docker** sobre tu VPS, gestionados con `docker compose`.
- **Exposición HTTPS sin dominio (provisional):** **Cloudflare Tunnel** (`cloudflared`) publica la API en una URL `https://<...>.trycloudflare.com` o `<...>.cfargotunnel.com`. Ventajas: HTTPS automático, no abrimos puertos en el VPS, oculta la IP. Cuando compres el dominio (Cloudflare DNS), el mismo tunnel se reconfigura al hostname propio en 2 minutos.
- **Nginx en el host** como reverse proxy interno (`127.0.0.1:80` → API). Certbot/Let's Encrypt se incorpora **sólo cuando exista dominio**; mientras tanto, TLS lo aporta el tunnel.
- **Next.js en Vercel**, llamando a la URL pública del tunnel (variable de entorno `NEXT_PUBLIC_API_URL`).
- **CORS** restringido a tus dominios de Vercel (producción + previews).
- **Variables de entorno** vía `.env` en VPS (nunca al repo) y dashboard de Vercel.

---

## 1. Stack propuesto

### VPS (Backend + DB)
| Capa | Elección | Por qué |
|---|---|---|
| OS | Ubuntu 24.04 LTS | LTS, soporte largo, docs masivas |
| Runtime contenedores | Docker + Docker Compose v2 | Portabilidad, rollback fácil |
| Reverse proxy | **Nginx** (host) | Estándar, fácil de auditar |
| Exposición pública (sin dominio) | **Cloudflare Tunnel** | HTTPS gratis sin abrir puertos ni dominio |
| TLS (con dominio, futuro) | Certbot + Let's Encrypt | Renovación automática |
| Base de datos | **PostgreSQL 16** (oficial) | Relacional robusto, JSONB cuando haga falta |
| Backend | **Node.js 20 LTS + Fastify** | Más liviano que Express, mejor DX que NestJS para este alcance |
| ORM | **Prisma** | Migraciones declarativas, tipado end-to-end con Next.js |
| Validación | **Zod** | Mismo esquema en front y back |
| Auth | **JWT (access + refresh)** + bcrypt | Sin dependencias externas, sencillo de operar |
| Email | **Resend** o SMTP de tu proveedor | Confirmaciones y recordatorios |
| Firewall | **UFW** | 22, 80, 443 abiertos; resto cerrado |
| SSH | **Fail2ban** + sólo clave pública | Hardening básico |
| Logs | `docker logs` + rotación | Suficiente para empezar; Loki/Grafana más adelante |
| Backups | `pg_dump` diario + retención 7/30 | Cron en host, copiado a almacenamiento off-site |

### Frontend (Vercel)
| Capa | Elección |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Estilos | Tailwind CSS v4 + **CSS variables** para tokens (`--color-primary`, etc.) |
| Tema centralizado | `theme.config.ts` + `globals.css` con tokens — un único punto de cambio |
| UI primitives | shadcn/ui (Radix) — opcional, copiable |
| Data fetching | TanStack Query (cliente) + `fetch` con `cache: 'no-store'` (server) |
| Forms | react-hook-form + zod |
| Auth en cliente | Auth.js (NextAuth) con provider Credentials que pega al API |

### Justificación de Fastify sobre Express/NestJS
- Express: maduro pero sin tipado nativo, ecosistema disperso.
- NestJS: excelente pero overhead conceptual alto (módulos, DI) — innecesario para CRUD + reservas.
- Fastify: alto rendimiento, schemas JSON nativos, plugins bien definidos, curva de aprendizaje suave.

---

## 2. Roadmap por hitos

Cada hito es un PR revisable. Estimaciones asumen ~1–2 sesiones por semana.

### M0 — Prerrequisitos (Día 0) ✅
- [x] VPS Ubuntu 24.04 accesible por SSH.
- [x] Repo GitHub creado (`juninho2604/barberia`).
- [ ] Cuenta Vercel (se confirma en M5, no bloquea ahora).
- [ ] ~~Dominio~~ — pospuesto. Mientras tanto: Cloudflare Tunnel.

### M1 — Provisioning del VPS (Semana 1)
- [ ] Generar clave SSH local (usuario) y subirla al VPS (`ssh-copy-id`).
- [ ] Crear usuario non-root con sudo. SSH sólo por clave; deshabilitar password auth y login root.
- [ ] UFW (22/80/443), Fail2ban, `unattended-upgrades`.
- [ ] Docker + Compose v2 instalados.
- [ ] Nginx en host (sólo escucha en `127.0.0.1`, sin TLS aún — TLS lo aporta el tunnel).
- [ ] Cloudflare Tunnel (`cloudflared`) instalado y conectado a una cuenta Cloudflare gratuita; URL pública HTTPS funcionando.
- [ ] `docker compose up` con Postgres vacío + healthcheck.

**Entregable:** servidor hardened, API alcanzable por HTTPS desde internet vía tunnel, `pg_isready` en verde.

### M2 — Esqueleto backend (Semana 1–2)
- [ ] Repo monorepo: `apps/api`, `apps/web`, `packages/shared`.
- [ ] Fastify + Prisma + Zod + endpoint `/health`.
- [ ] Dockerfile multi-stage para la API.
- [ ] Pipeline manual: `git pull && docker compose build api && docker compose up -d`.
- [ ] Primera migración Prisma aplicada.

### M3 — Auth + dominio base (Semana 2)
- [ ] Modelos `User`, `Service`, `Barber` con migraciones.
- [ ] `/auth/register`, `/auth/login`, `/auth/me` (JWT).
- [ ] CRUD `/services` (público GET, admin write).
- [ ] CRUD `/barbers` + horarios laborales.
- [ ] Tests de integración con Postgres efímero.

### M4 — Disponibilidad y reservas (Semana 2–3)
- [ ] `GET /availability?barberId&date` con cálculo de slots libres.
- [ ] `POST /appointments` con validación anti-doble-booking (constraint EXCLUDE en Postgres).
- [ ] `PATCH /appointments/:id/status` (confirm / cancel / no-show / complete).
- [ ] Time-off / bloqueos de agenda.

### M5 — Frontend base + Vercel (Semana 3)
- [ ] Proyecto Next.js, conexión a Vercel, env vars.
- [ ] `theme.config.ts` + CSS variables, Tailwind extendido leyendo los tokens.
- [ ] Layout, header, footer, página de servicios pública.
- [ ] Cliente API tipado generado desde Zod/Prisma.

### M6 — Flujo público de reserva (Semana 3–4)
- [ ] Wizard: servicio → barbero → fecha/hora → datos de contacto → confirmación.
- [ ] Email de confirmación al cliente y al admin.

### M7 — Panel administración (Semana 4)
- [ ] Login admin (`/admin`).
- [ ] Vista de agenda semanal/diaria (drag o tabla).
- [ ] CRUDs: servicios, barberos, usuarios, citas.
- [ ] Estados de cita y notas internas.

### M8 — Hardening + ops (Semana 4–5)
- [ ] Backups `pg_dump` automatizados + restore probado.
- [ ] Monitor básico (uptime check externo + alerta email).
- [ ] Rate limit en endpoints públicos.
- [ ] Documentación de runbook (deploy, restore, rotar JWT secret).

---

## 3. Esquema de base de datos

```prisma
// schema.prisma — versión inicial, abierta a discusión

enum Role {
  CLIENT
  BARBER
  ADMIN
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
  NO_SHOW
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  phone        String?
  role         Role     @default(CLIENT)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  barberProfile      Barber?
  appointmentsAsClient Appointment[] @relation("ClientAppointments")
}

model Barber {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  bio       String?
  photoUrl  String?
  isActive  Boolean  @default(true)

  workingHours WorkingHour[]
  timeOff      TimeOff[]
  appointments Appointment[]
}

model Service {
  id              String   @id @default(cuid())
  name            String
  description     String?
  durationMinutes Int           // p.ej. 30, 45, 60
  priceCents      Int           // dinero como entero, evita floats
  isActive        Boolean  @default(true)

  appointments Appointment[]
}

model WorkingHour {
  id        String  @id @default(cuid())
  barberId  String
  barber    Barber  @relation(fields: [barberId], references: [id])
  weekday   Int     // 0 = domingo … 6 = sábado
  startMin  Int     // minutos desde 00:00 (ej. 9*60 = 540)
  endMin    Int

  @@index([barberId, weekday])
}

model TimeOff {
  id        String   @id @default(cuid())
  barberId  String
  barber    Barber   @relation(fields: [barberId], references: [id])
  startsAt  DateTime
  endsAt    DateTime
  reason    String?

  @@index([barberId, startsAt])
}

model Appointment {
  id         String            @id @default(cuid())
  clientId   String
  client     User              @relation("ClientAppointments", fields: [clientId], references: [id])
  barberId   String
  barber     Barber            @relation(fields: [barberId], references: [id])
  serviceId  String
  service    Service           @relation(fields: [serviceId], references: [id])
  startsAt   DateTime
  endsAt     DateTime
  status     AppointmentStatus @default(PENDING)
  notes      String?
  createdAt  DateTime          @default(now())

  @@index([barberId, startsAt])
  @@index([clientId])
}
```

**Garantía de no doble-booking:** añadiremos en una migración manual un
`EXCLUDE` con `tstzrange` para que la propia DB rechace solapamientos por
barbero (más seguro que validar en código).

---

## 4. Estructura de la API (REST)

Convención: JSON, errores `{ error: { code, message } }`, paginación `?page&pageSize`.

### Públicos
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register` | Registro de cliente |
| POST | `/auth/login` | Devuelve access + refresh JWT |
| POST | `/auth/refresh` | Rota tokens |
| GET  | `/services` | Lista de servicios activos |
| GET  | `/barbers` | Lista de barberos activos |
| GET  | `/availability` | `?barberId&date&serviceId` → slots libres |
| POST | `/appointments` | Crear reserva (cliente autenticado) |

### Cliente autenticado
| Método | Ruta | Descripción |
|---|---|---|
| GET  | `/me` | Perfil |
| GET  | `/me/appointments` | Mis reservas |
| PATCH| `/appointments/:id/cancel` | Cancelar la propia |

### Admin / Barber
| Método | Ruta | Descripción |
|---|---|---|
| GET/POST/PATCH/DELETE | `/admin/services` | CRUD |
| GET/POST/PATCH/DELETE | `/admin/barbers` | CRUD perfiles |
| POST/DELETE | `/admin/barbers/:id/working-hours` | Calendario laboral |
| POST/DELETE | `/admin/barbers/:id/time-off` | Vacaciones / bloqueos |
| GET  | `/admin/appointments` | Filtros por fecha/barbero/estado |
| PATCH| `/admin/appointments/:id/status` | confirm/complete/no-show |
| GET/POST/PATCH/DELETE | `/admin/users` | Gestión usuarios |

---

## 5. Guía de configuración del entorno (prerrequisitos VPS)

Antes de nuestra primera sesión técnica, necesito que tengas listo:

### Hardware / proveedor
- VPS con **2 vCPU, 2–4 GB RAM, 40 GB SSD** mínimo (Hetzner CX22, DigitalOcean Basic, Contabo VPS S sirven).
- IP pública estática.

### Sistema operativo
- **Ubuntu 24.04 LTS** o Debian 12 recién instalado.
- Acceso SSH como `root` (la primera sesión lo desactivaremos).

### DNS
- Dominio donde puedas crear registros A.
- Registro `A` para `api.tudominio.com` apuntando a la IP del VPS.
- (Opcional) registro `A` para `tudominio.com` que apuntará a Vercel después.

### Credenciales que necesitarás a mano
- Tu **clave SSH pública** (`~/.ssh/id_ed25519.pub`). Si no la tienes la generamos juntos.
- Email válido para Let's Encrypt (recibe avisos de expiración).
- Cuenta de GitHub con el repo creado.
- Cuenta de Vercel (gratuita basta) vinculada a GitHub.
- (Opcional M8) cuenta Resend o credenciales SMTP para emails.

### Lo que **no** hace falta todavía
- No instales nada en el VPS, lo haremos juntos paso a paso.
- No subas secretos al repo; los gestionaremos con `.env` y Vercel dashboard.

---

## 6. Estructura del repositorio (propuesta)

```
BARBERIA/
├── apps/
│   ├── api/                 # Fastify + Prisma
│   │   ├── src/
│   │   ├── prisma/
│   │   ├── Dockerfile
│   │   └── package.json
│   └── web/                 # Next.js (Vercel)
│       ├── app/
│       ├── components/
│       ├── theme.config.ts
│       └── package.json
├── packages/
│   └── shared/              # Tipos y esquemas Zod compartidos
├── infra/
│   ├── docker-compose.yml   # api + postgres
│   ├── nginx/
│   │   └── api.conf
│   └── scripts/
│       ├── backup.sh
│       └── restore.sh
├── docs/
│   └── PLAN.md              # este documento
└── README.md
```

Monorepo con **pnpm workspaces** — sin Turborepo todavía para mantenerlo simple.

---

## 7. Riesgos y decisiones abiertas (a discutir antes de M2)

1. **Zona horaria:** ¿guardamos todo en UTC y convertimos en cliente? (recomendado).
2. **Slot granularity:** ¿cada 15 o 30 min? Afecta cálculo de disponibilidad.
3. **Multi-barbero o un solo barbero?** El modelo soporta ambos, pero la UI cambia.
4. **Reserva sin registro:** ¿permitir que un cliente reserve dando sólo email/teléfono? Sí/no impacta `User`.
5. **Notificaciones:** ¿email solamente o también SMS/WhatsApp (Twilio)?
6. **Pagos:** fuera de alcance v1, pero dejar `priceCents` preparado.

---

## 8. Próximo paso

Tu turno: revisa el documento y dime
- (a) qué cambias del stack,
- (b) respuestas a los 6 puntos abiertos,
- (c) si los plazos del roadmap encajan con tu disponibilidad.

Cuando aprobemos esto, abrimos **M0/M1** y empezamos a tocar el VPS juntos.
