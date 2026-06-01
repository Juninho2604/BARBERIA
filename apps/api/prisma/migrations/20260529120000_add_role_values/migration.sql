-- Migración M9 (parte 1/2): extiende el enum Role.
--
-- Añade RECEPTIONIST, MANAGER, OWNER. ADMIN se mantiene como legacy alias
-- (no se elimina por back-compat; el cliente lo trata como OWNER vía
-- apps/web/src/lib/permissions.ts ROLE_LABEL).
--
-- Esta migración va sola porque Postgres no permite usar un valor de enum
-- recién añadido dentro de la misma transacción. El backfill ADMIN → OWNER
-- vive en la migración siguiente.

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'RECEPTIONIST';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'MANAGER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'OWNER';
