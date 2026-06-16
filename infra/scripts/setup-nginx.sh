#!/usr/bin/env bash
# Añade el vhost de Barbería a un Nginx existente en el VPS.
#
# Este script asume que el VPS ya tiene Nginx + certbot instalados y
# configurados (hay otros sitios en producción). NO reinstala ni
# reconfigura nada global — solo:
#   1. Copia el vhost de Barbería a /etc/nginx/sites-available/
#   2. Obtiene cert vía `certbot certonly --nginx` para
#      brothersclubbarbers.com + www
#   3. Symlinkea a sites-enabled/ y recarga Nginx
#
# Es idempotente: se puede correr de nuevo sin romper el cert ni los
# otros vhosts. Si el cert ya existe, certbot solo lo renueva si quedan
# <30 días.
#
# Uso (desde el VPS, como root):
#   bash /opt/barberia/infra/scripts/setup-nginx.sh

set -euo pipefail

DOMAIN="brothersclubbarbers.com"
WWW_DOMAIN="www.brothersclubbarbers.com"
# Email para Let's Encrypt — el usuario recibe alertas si el cert falla
# en renovar antes del vencimiento (los 90 días estándar de LE).
EMAIL="${LETSENCRYPT_EMAIL:-omarmoya2604@gmail.com}"
NGINX_CONF_SRC="/opt/barberia/infra/nginx/${DOMAIN}.conf"
NGINX_CONF_DST="/etc/nginx/sites-available/${DOMAIN}.conf"
NGINX_LINK="/etc/nginx/sites-enabled/${DOMAIN}.conf"

echo "==> 1/5 chequeos previos"
if ! systemctl is-active --quiet nginx; then
  echo "✗ Nginx no está corriendo. Este script no instala Nginx; el host"
  echo "  ya debería tenerlo activo (revisar: systemctl status nginx)."
  exit 1
fi
if ! command -v certbot >/dev/null 2>&1; then
  echo "✗ certbot no está instalado. Este script no lo instala."
  echo "  apt-get install -y certbot python3-certbot-nginx"
  exit 1
fi
if [ ! -f "$NGINX_CONF_SRC" ]; then
  echo "✗ No encuentro $NGINX_CONF_SRC. ¿Hiciste git pull?"
  exit 1
fi
echo "✓ Nginx activo, certbot $(certbot --version 2>&1 | awk '{print $2}'), vhost fuente presente"

echo "==> 2/5 obteniendo cert de Let's Encrypt para ${DOMAIN} + ${WWW_DOMAIN}"
# `certonly --nginx` usa el autenticador de Nginx (modifica temporalmente
# la config para servir el challenge HTTP-01, luego restaura). NO instala
# el cert en ningún vhost (eso lo hace nuestro conf manualmente). Es
# idempotente: si el cert ya existe y le quedan >30d, no hace nada.
certbot certonly \
    --nginx \
    -d "$DOMAIN" \
    -d "$WWW_DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    --keep-until-expiring

echo "==> 3/5 copiando vhost a sites-available/"
cp "$NGINX_CONF_SRC" "$NGINX_CONF_DST"

echo "==> 4/5 habilitando vhost (symlink en sites-enabled/)"
ln -sf "$NGINX_CONF_DST" "$NGINX_LINK"

echo "==> 5/5 nginx -t + reload"
# `nginx -t` valida TODA la config global, no solo nuestro vhost. Si
# algo de otro sitio tiene un syntax error, nos vamos a enterar acá —
# pero NO recargamos en ese caso (evita tirar todo el host).
nginx -t
systemctl reload nginx

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ Vhost añadido y Nginx recargado"
echo "═══════════════════════════════════════════"
echo "   URL:        https://${DOMAIN}"
echo "   Cert:       /etc/letsencrypt/live/${DOMAIN}/"
echo "   Vhost:      ${NGINX_CONF_DST}"
echo "   Renovación: certbot.timer (cada 12h vía systemd)"
echo ""
echo "   Smoke test (desde el VPS):"
echo "     curl -fsS https://${DOMAIN}/api/health"
echo "     curl -fsS -o /dev/null -w '%{http_code}\\n' https://${DOMAIN}/"
