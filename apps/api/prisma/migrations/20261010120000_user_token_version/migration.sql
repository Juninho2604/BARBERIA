-- Revocación de sesiones: los JWT llevan `tv` y deben coincidir con este valor.
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
