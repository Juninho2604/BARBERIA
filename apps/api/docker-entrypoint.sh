#!/bin/sh
# Entrypoint del contenedor API.
# 1. Aplica migraciones pendientes contra la DB (idempotente).
# 2. Corre el seed (idempotente — no recrea registros existentes).
# 3. Arranca el servidor Fastify.
set -e

echo "→ Aplicando migraciones Prisma…"
npx prisma migrate deploy

echo "→ Ejecutando seed (idempotente)…"
# `prisma db seed` lee package.json → "prisma.seed". El seed.ts es seguro
# de re-ejecutar: skip de servicios/barberos/owner si ya existen.
npx prisma db seed || echo "⚠ seed falló (no bloqueante) — revisar logs"

echo "→ Arrancando API…"
exec node dist/index.js
