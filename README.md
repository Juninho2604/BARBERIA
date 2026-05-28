# Barbería

Plataforma integral: landing pública + reservas online + panel admin.

Documentación viva:
- [`CLAUDE.md`](./CLAUDE.md) — estado del proyecto (se actualiza en cada commit significativo).
- [`docs/PLAN.md`](./docs/PLAN.md) — arquitectura, roadmap, schema, API.

## Estructura

```
apps/
├── api/         Fastify + Prisma — desplegado en VPS vía Docker
└── web/         Next.js 15 + Tailwind v4 — desplegado en Vercel
packages/
└── shared/     Esquemas Zod compartidos
infra/
└── docker-compose.yml   Postgres + API (VPS)
```

## Despliegue

- **Frontend:** Vercel autodeploya cada push a la rama configurada.
- **Backend + DB:** VPS `147.93.6.70`, pull desde GitHub + `docker compose up`.

Más detalle en `docs/PLAN.md`.
