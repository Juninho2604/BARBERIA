-- Previene doble booking del mismo slot: índice único parcial sobre
-- (barberId, startsAt) excluyendo citas CANCELADAS. Sin esto, dos requests
-- simultáneas pueden pasar el re-check de la transacción del handler y
-- ambas insertar una cita en el mismo slot.
--
-- Citas canceladas no entran al índice — así un slot que se libera por
-- cancelación puede volver a reservarse sin conflicto.
--
-- El handler captura P2002 (unique constraint violation de Prisma) y
-- devuelve 409 SLOT_TAKEN con mensaje amigable.

CREATE UNIQUE INDEX IF NOT EXISTS "Appointment_barberId_startsAt_active_uniq"
  ON "Appointment" ("barberId", "startsAt")
  WHERE "status" <> 'CANCELLED';
