#!/usr/bin/env bash
# Bootstrap inicial del VPS para correr Barbería.
# Se ejecuta UNA SOLA VEZ tras provisionar el VPS.
# Idempotente: se puede volver a correr sin romper nada.
#
# Uso:
#   curl -fsSL https://raw.githubusercontent.com/juninho2604/barberia/claude/quirky-ride-pD2AK/infra/scripts/vps-bootstrap.sh | sudo bash
# o tras clonar:
#   sudo bash infra/scripts/vps-bootstrap.sh

set -euo pipefail

REPO_URL="https://github.com/juninho2604/barberia.git"
REPO_BRANCH="claude/quirky-ride-pD2AK"
APP_DIR="/opt/barberia"
DEPLOY_KEY_PATH="/root/.ssh/barberia_deploy"

echo "═══════════════════════════════════════════"
echo "  Bootstrap VPS — Barbería"
echo "═══════════════════════════════════════════"

# ---------- 1. Docker ----------
if ! command -v docker >/dev/null 2>&1; then
  echo "→ Instalando Docker…"
  apt-get update
  apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    | tee /etc/apt/sources.list.d/docker.list >/dev/null
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
  echo "✓ Docker instalado: $(docker --version)"
else
  echo "✓ Docker ya estaba instalado: $(docker --version)"
fi

# ---------- 2. Clonar repo ----------
if [ ! -d "${APP_DIR}/.git" ]; then
  echo "→ Clonando repo en ${APP_DIR}…"
  git clone --branch "${REPO_BRANCH}" "${REPO_URL}" "${APP_DIR}"
else
  echo "→ Actualizando repo en ${APP_DIR}…"
  cd "${APP_DIR}"
  git fetch origin
  git checkout "${REPO_BRANCH}"
  git reset --hard "origin/${REPO_BRANCH}"
fi

# ---------- 3. .env ----------
if [ ! -f "${APP_DIR}/.env" ]; then
  echo "→ Generando ${APP_DIR}/.env con secretos aleatorios…"
  POSTGRES_PASSWORD="$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)"
  JWT_ACCESS_SECRET="$(openssl rand -base64 48 | tr -d '\n')"
  JWT_REFRESH_SECRET="$(openssl rand -base64 48 | tr -d '\n')"

  cat > "${APP_DIR}/.env" <<EOF
# Generado por vps-bootstrap.sh. Edítalo a mano si necesitas cambiar algo.
# NUNCA commitear este archivo.

# --- Postgres ---
POSTGRES_USER=barberia
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=barberia

# --- API ---
# Orígenes permitidos para CORS. Con Nginx reverse proxy en mismo origen
# basta con el dominio del sitio.
CORS_ORIGINS=https://brothersclubbarbers.com
JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
DEFAULT_TIMEZONE=America/New_York
SLOT_GRANULARITY_MINUTES=30

# --- Web (build args para Next.js) ---
# SITE_URL se inlina en el bundle al build → cambiarlo requiere rebuild.
SITE_URL=https://brothersclubbarbers.com

# --- Seed inicial (primer OWNER) ---
# Borrá INITIAL_OWNER_PASSWORD después del primer arranque (el hash ya
# queda en DB y el login sigue funcionando con la contraseña original).
INITIAL_OWNER_EMAIL=
INITIAL_OWNER_PASSWORD=
INITIAL_OWNER_NAME=Owner
EOF
  chmod 600 "${APP_DIR}/.env"
  echo "✓ .env creado con secretos aleatorios (modo 600)"
else
  echo "✓ .env ya existe — no se sobrescribe"
fi

# ---------- 4. Deploy key para GitHub Actions ----------
mkdir -p /root/.ssh
chmod 700 /root/.ssh

if [ ! -f "${DEPLOY_KEY_PATH}" ]; then
  echo "→ Generando clave SSH dedicada para GitHub Actions…"
  ssh-keygen -t ed25519 -N "" -C "github-actions-barberia" -f "${DEPLOY_KEY_PATH}"
  cat "${DEPLOY_KEY_PATH}.pub" >> /root/.ssh/authorized_keys
  sort -u /root/.ssh/authorized_keys -o /root/.ssh/authorized_keys
  echo "✓ Clave generada y añadida a authorized_keys"
else
  echo "✓ Clave de deploy ya existe — no se regenera"
fi

# ---------- 5. Primer build ----------
cd "${APP_DIR}"
echo "→ Primer build y arranque de contenedores (puede tardar 2-3 min)…"
docker compose --env-file .env -f infra/docker-compose.yml up -d --build

echo "═══════════════════════════════════════════"
echo "  ✓ Bootstrap completado"
echo "═══════════════════════════════════════════"
echo ""
echo "─────────────────────────────────────────────"
echo "  AÑADE ESTOS SECRETS EN GITHUB"
echo "  Settings → Secrets and variables → Actions"
echo "─────────────────────────────────────────────"
echo ""
echo "VPS_HOST = $(curl -s ifconfig.me || echo '147.93.6.70')"
echo "VPS_USER = root"
echo "VPS_PORT = 22"
echo ""
echo "VPS_SSH_KEY = (copia el bloque completo de abajo)"
echo ""
cat "${DEPLOY_KEY_PATH}"
echo ""
echo "─────────────────────────────────────────────"
echo ""
echo "Tras añadir los secrets, los próximos push a la rama dispararán deploys automáticos."
