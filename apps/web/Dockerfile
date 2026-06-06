# Multi-stage build de Next.js standalone para monorepo pnpm.
# Se ejecuta desde la raíz del monorepo: docker build -f apps/web/Dockerfile .
#
# NEXT_PUBLIC_* env vars se inlinan en el bundle al `next build`, por eso
# llegan vía ARG (build time) y no como env runtime.

FROM node:20-bookworm-slim AS base
RUN corepack enable
WORKDIR /app

# ---- deps: instala solo lo necesario para web + shared ----
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --filter @barberia/web... --filter @barberia/shared

# ---- build: compila shared + web ----
FROM base AS build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_ALLOW_MOCK
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_ALLOW_MOCK=${NEXT_PUBLIC_ALLOW_MOCK}
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .

RUN pnpm --filter @barberia/shared build
RUN pnpm --filter @barberia/web build

# ---- runtime: imagen minimal con .next/standalone + .next/static + public ----
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

# Standalone trae el server.js y todo node_modules realmente usado.
COPY --from=build /app/apps/web/.next/standalone ./
# Static assets generados (chunks, css, fonts) — no van en standalone.
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
# Public assets (logo, photos, GLB, robots.txt, etc.)
COPY --from=build /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
