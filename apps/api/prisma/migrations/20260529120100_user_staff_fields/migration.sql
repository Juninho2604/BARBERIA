-- Migración M9 (parte 2/2): nuevos campos en User + backfill de ADMIN.
--
-- Cambios:
-- 1. Promociona usuarios ADMIN existentes a OWNER (back-compat). Ahora que
--    el valor OWNER existe (migración anterior), podemos usarlo.
-- 2. User.isActive — staff desactivado o cliente bloqueado.
-- 3. User.notes — notas internas del staff sobre el cliente.
-- 4. User.lastLoginAt — última vez que el usuario entró al panel.
--
-- `IF NOT EXISTS` para idempotencia en clínicas que ya corrieron variantes
-- a mano.

UPDATE "User" SET "role" = 'OWNER' WHERE "role" = 'ADMIN';

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
