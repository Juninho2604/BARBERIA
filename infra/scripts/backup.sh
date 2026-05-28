#!/usr/bin/env bash
# Backup de la base de datos.
# - Vuelca Postgres comprimido a /opt/barberia/backups/.
# - Mantiene los últimos REPO_BACKUP_DAYS (por defecto 14) días.
# - Pensado para ejecutarse desde cron.
#
# Uso manual:
#   /opt/barberia/infra/scripts/backup.sh
#
# Para instalar el cron diario (a las 03:30 del VPS):
#   ( crontab -l 2>/dev/null; echo "30 3 * * * /opt/barberia/infra/scripts/backup.sh >> /var/log/barberia-backup.log 2>&1" ) | crontab -

set -euo pipefail

REPO_ROOT="${REPO_ROOT:-/opt/barberia}"
BACKUP_DIR="${BACKUP_DIR:-${REPO_ROOT}/backups}"
RETENTION_DAYS="${REPO_BACKUP_DAYS:-14}"
CONTAINER="${POSTGRES_CONTAINER:-barberia-postgres}"

mkdir -p "${BACKUP_DIR}"

STAMP="$(date -u +%Y%m%d-%H%M%S)"
OUT="${BACKUP_DIR}/barberia-${STAMP}.sql.gz"

echo "→ Volcando ${CONTAINER} a ${OUT}"
# Usamos las env vars del propio contenedor para no leer .env desde fuera.
docker exec "${CONTAINER}" sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges' \
  | gzip -9 > "${OUT}.tmp"
mv "${OUT}.tmp" "${OUT}"

SIZE="$(du -h "${OUT}" | cut -f1)"
echo "✓ Backup OK (${SIZE})"

echo "→ Rotando backups de más de ${RETENTION_DAYS} días"
find "${BACKUP_DIR}" -maxdepth 1 -name "barberia-*.sql.gz" -mtime "+${RETENTION_DAYS}" -print -delete

echo "✓ Done."
