#!/usr/bin/env bash
# Instala Nginx + certbot en el VPS, copia la config, obtiene el cert de
# Let's Encrypt y arma la renovación automática.
#
# Uso (desde el VPS, como root):
#   bash /opt/barberia/infra/scripts/setup-nginx.sh

set -euo pipefail

DOMAIN="brothersclubbarbers.com"
WWW_DOMAIN="www.brothersclubbarbers.com"
# Email para Let's Encrypt — el usuario lo confirmará después.
# Sin un email real, las renovaciones siguen funcionando pero NO recibes
# alertas antes del vencimiento (90 días) si algo falla.
EMAIL="${LETSENCRYPT_EMAIL:-admin@${DOMAIN}}"
NGINX_CONF_SRC="/opt/barberia/infra/nginx/${DOMAIN}.conf"
NGINX_CONF_DST="/etc/nginx/sites-available/${DOMAIN}.conf"
NGINX_LINK="/etc/nginx/sites-enabled/${DOMAIN}.conf"
ACME_ROOT="/var/www/letsencrypt"

echo "==> 1/6 instalando nginx + certbot"
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

echo "==> 2/6 configurando acme-challenge directory"
mkdir -p "$ACME_ROOT"
chown -R www-data:www-data "$ACME_ROOT"

echo "==> 3/6 copiando site config"
# Antes del primer certbot, los paths a /etc/letsencrypt/live/... no existen
# todavía → nginx -t fallaría. Servimos un config HTTP-only temporal para
# el handshake del cert, después restauramos el config completo.
cat >"$NGINX_CONF_DST" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${WWW_DOMAIN};
    location /.well-known/acme-challenge/ {
        root ${ACME_ROOT};
    }
    location / {
        return 200 'Bootstrap — esperando certificado';
        add_header Content-Type text/plain;
    }
}
EOF
ln -sf "$NGINX_CONF_DST" "$NGINX_LINK"
# Removemos el default site si existe (libera puerto 80)
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> 4/6 obteniendo certificado Let's Encrypt"
certbot certonly \
    --webroot -w "$ACME_ROOT" \
    -d "$DOMAIN" \
    -d "$WWW_DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive \
    --no-eff-email

echo "==> 5/6 instalando config HTTPS final"
cp "$NGINX_CONF_SRC" "$NGINX_CONF_DST"
nginx -t
systemctl reload nginx

echo "==> 6/6 renovación automática (systemd timer ya activo)"
systemctl enable --now certbot.timer
systemctl status certbot.timer --no-pager | head -10

echo ""
echo "✅ Nginx + HTTPS listos."
echo "   URL: https://${DOMAIN}"
echo "   Cert expira: $(certbot certificates 2>/dev/null | grep 'Expiry' | head -1)"
echo "   Renovación: cada 12h vía certbot.timer (renew solo si quedan <30d)"
