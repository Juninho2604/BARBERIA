#!/bin/bash
# Revisión de seguridad del VPS — SOLO LECTURA, no cambia nada.
# No imprime secretos: de .env solo muestra si existen y su longitud.
#
# Uso (como root en el VPS):
#   bash /opt/barberia/infra/scripts/security-check.sh
R=${R:-/opt/barberia}
ok()   { echo "  [OK]   $*"; }
bad()  { echo "  [FALTA] $*"; }
info() { echo "  [INFO] $*"; }
sec()  { echo; echo "== $* =="; }
q() { docker exec -i barberia-postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tA -F" | "' <<< "$1" 2>/dev/null; }

sec "Código desplegado"
cd "$R" 2>/dev/null && info "commit en el VPS: $(git log --oneline -1 2>/dev/null)"
docker ps --format '{{.Names}} {{.Status}}' | grep barberia | sed 's/^/  /'
for c in barberia-api barberia-web; do
  u=$(docker exec $c id -u 2>/dev/null); v=$(docker exec $c node -v 2>/dev/null)
  [ "$u" = "1000" ] && ok "$c corre sin root (node $v)" || bad "$c corre como uid=$u (node $v)"
done

sec "Cuentas (1. rotación de contraseñas)"
if [ "$(q 'SELECT 1;')" != "1" ]; then bad "no se pudo consultar la base de datos (¿contenedor barberia-postgres caído?)"; else
q 'SELECT email, role, CASE WHEN "isActive" THEN '"'"'activo'"'"' ELSE '"'"'INACTIVO'"'"' END, "tokenVersion", COALESCE(to_char("lastLoginAt",'"'"'YYYY-MM-DD HH24:MI'"'"'),'"'"'nunca'"'"') FROM "User" WHERE role IN ('"'"'OWNER'"'"','"'"'ADMIN'"'"','"'"'MANAGER'"'"','"'"'RECEPTIONIST'"'"') ORDER BY email;' | sed 's/^/  /'
for e in roman edgar francesco victor; do
  tv=$(q "SELECT \"tokenVersion\" FROM \"User\" WHERE email='$e@brothersclubbarbers.com';")
  [ -n "$tv" ] && [ "$tv" -gt 0 ] 2>/dev/null && ok "$e: contraseña rotada (tokenVersion=$tv)" || bad "$e: contraseña SIN rotar (tokenVersion=${tv:-?})"
done
pr=$(q "SELECT CASE WHEN \"isActive\" THEN 'activa' ELSE 'inactiva' END FROM \"User\" WHERE email='prueba@barberia.com';")
case "$pr" in "") ok "prueba@barberia.com eliminada";; inactiva) ok "prueba@barberia.com inactiva";; *) bad "prueba@barberia.com sigue activa";; esac
fi

sec ".env (2. llaves de sesión)"
if [ -f "$R/.env" ]; then
  p=$(stat -c %a "$R/.env"); [ "$p" = "600" ] && ok ".env con permisos 600" || bad ".env con permisos $p (debería ser 600)"
  for k in JWT_ACCESS_SECRET JWT_REFRESH_SECRET; do
    v=$(grep -E "^$k=" "$R/.env" | cut -d= -f2-); info "$k: ${#v} caracteres (no se muestra)"
  done
  ttl=$(grep -E '^JWT_REFRESH_TTL=' "$R/.env" | cut -d= -f2-)
  [ "$ttl" = "7d" ] && ok "JWT_REFRESH_TTL=7d" || bad "JWT_REFRESH_TTL=${ttl:-<sin definir, usa 7d por defecto>}"
  ip=$(grep -E '^INITIAL_OWNER_PASSWORD=' "$R/.env" | cut -d= -f2-)
  [ -z "$ip" ] && ok "INITIAL_OWNER_PASSWORD vacía" || bad "INITIAL_OWNER_PASSWORD todavía tiene valor"
  newest=$(ls -t "$R"/.env.bak-* 2>/dev/null | head -1)
  [ -n "$newest" ] && info "último respaldo de .env: $(basename "$newest") → indica que la rotación se hizo" || info "no hay .env.bak-* → probablemente la rotación de llaves no se hizo"
else bad "no existe $R/.env"; fi

sec "Nginx (3. vhost nuevo)"
V=/etc/nginx/sites-available/brothersclubbarbers.com.conf
if diff -q "$V" "$R/infra/nginx/brothersclubbarbers.com.conf" >/dev/null 2>&1; then ok "vhost aplicado = versión del repo"; else bad "vhost en el servidor distinto al del repo (correr setup-nginx.sh)"; fi
grep -q "server_tokens off" "$V" 2>/dev/null && ok "server_tokens off" || bad "nginx muestra su versión (o vhost no encontrado)"
if [ ! -f "$V" ]; then bad "no existe $V"
elif grep -q 'X-Forwarded-For \$proxy_add_x_forwarded_for' "$V"; then bad "XFF todavía con \$proxy_add_x_forwarded_for"
else ok "XFF = \$remote_addr"; fi
nginx -t >/dev/null 2>&1 && ok "nginx -t correcto" || bad "nginx -t con errores"
le=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/brothersclubbarbers.com/fullchain.pem 2>/dev/null | cut -d= -f2)
info "certificado TLS vence: ${le:-?}"

sec "Backups (4.)"
if [ -d "$R/backups" ]; then
  p=$(stat -c %a "$R/backups"); [ "$p" = "700" ] && ok "carpeta backups 700" || bad "carpeta backups $p (debería ser 700)"
  open=$(find "$R/backups" -name '*.sql.gz' -perm /044 | wc -l); [ "$open" = 0 ] && ok "ningún backup legible por otros" || bad "$open backups legibles por otros usuarios"
  last=$(ls -t "$R"/backups/*.sql.gz 2>/dev/null | head -1)
  [ -n "$last" ] && info "último backup: $(basename "$last") ($(date -r "$last" '+%Y-%m-%d'))" || info "último backup: ninguno"
else info "no existe $R/backups (todavía no se ha hecho ningún backup)"; fi
crontab -l 2>/dev/null | grep -q backup.sh && ok "cron de backup instalado" || bad "sin cron de backup diario"

sec "Servidor (6. para más adelante)"
sshd -T 2>/dev/null | grep -E '^(passwordauthentication|permitrootlogin|kbdinteractiveauthentication) ' | sed 's/^/  sshd: /'
ufw status 2>/dev/null | head -1 | sed 's/^/  ufw: /'
echo "  puertos abiertos al exterior:"; ss -tulpnH 2>/dev/null | awk '$5 !~ /^(127\.|\[::1\]|::1)/ {print "    "$1" "$5" "$7}' | sort -u
fail2ban-client status sshd 2>/dev/null | grep -E 'Currently banned|Total banned' | sed 's/^[ |`-]*/  fail2ban: /'
[ -f /var/run/reboot-required ] && bad "reinicio pendiente (kernel actual $(uname -r))" || ok "sin reinicio pendiente (kernel $(uname -r))"
info "llaves en /root/.ssh/authorized_keys: $(grep -c . /root/.ssh/authorized_keys 2>/dev/null)"

sec "CSP (últimos 14 días)"
n=$(docker logs --since 336h barberia-api 2>&1 | grep -c csp-violation)
info "$n reportes de violación"
docker logs --since 336h barberia-api 2>&1 | grep csp-violation | grep -oE '(blocked-uri|blockedURL)[^,]*' | sed 's/\\//g' | sort | uniq -c | sort -rn | head -8 | sed 's/^/    /'
echo; echo "Fin de la revisión. Copia todo este texto y pégalo en el chat."
