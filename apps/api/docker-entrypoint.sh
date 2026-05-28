#!/bin/sh
# Entrypoint del contenedor API.
# 1. Aplica migraciones pendientes contra la DB (idempotente).
# 2. Arranca el servidor Fastify.
set -e

echo "→ Aplicando migraciones Prisma…"
npx prisma migrate deploy

echo "→ Arrancando API…"
exec node dist/index.js
