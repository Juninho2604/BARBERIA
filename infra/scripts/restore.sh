#!/usr/bin/env bash
# Restaura un backup de Postgres.
#
# Uso:
#   /opt/barberia/infra/scripts/restore.sh /opt/barberia/backups/barberia-20260601-033000.sql.gz
#
# Cuidado: ESTO BORRA Y RECREA EL ESQUEMA. Pide confirmación interactiva.

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Uso: $0 <ruta-al-backup.sql.gz>" >&2
  exit 1
fi

BACKUP="$1"
CONTAINER="${POSTGRES_CONTAINER:-barberia-postgres}"

if [ ! -f "${BACKUP}" ]; then
  echo "✗ No existe: ${BACKUP}" >&2
  exit 1
fi

echo "⚠  Vas a SOBRESCRIBIR la base de datos con:"
echo "    ${BACKUP}"
echo "    contenedor: ${CONTAINER}"
read -r -p "Escribe 'restaurar' para continuar: " confirm
[ "${confirm}" = "restaurar" ] || { echo "Cancelado."; exit 1; }

echo "→ Limpiando esquema actual…"
docker exec "${CONTAINER}" sh -c \
  'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"'

echo "→ Restaurando desde ${BACKUP}…"
gunzip -c "${BACKUP}" | docker exec -i "${CONTAINER}" sh -c \
  'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

echo "✓ Restauración completada."
echo "Reiniciando API para refrescar Prisma…"
docker restart barberia-api
