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

echo "→ Backup de seguridad del estado actual antes de sobrescribir…"
"$(dirname "$0")/backup.sh"

echo "→ Deteniendo la API durante la restauración…"
docker stop barberia-api
# Pase lo que pase (también si la restauración falla), la API vuelve a arrancar.
trap 'echo "Arrancando la API…"; docker start barberia-api >/dev/null' EXIT

# Todo en una sola transacción: si el dump falla a mitad, se revierte el
# DROP y la base queda como estaba.
echo "→ Restaurando desde ${BACKUP}…"
{
  echo "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
  gunzip -c "${BACKUP}"
} | docker exec -i "${CONTAINER}" sh -c \
  'psql -v ON_ERROR_STOP=1 --single-transaction -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

echo "✓ Restauración completada."
