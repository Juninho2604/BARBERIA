-- Foto opcional por servicio. El cliente la usará para mostrar al
-- visitante una imagen del servicio (corte, barba, etc.) en el flujo
-- de reserva. Sin foto (NULL) la UI cae al layout actual sin imagen.
ALTER TABLE "Service" ADD COLUMN "photoUrl" TEXT;
