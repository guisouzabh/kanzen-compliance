#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$ROOT_DIR/deploy/.env.db"
COMPOSE_FILE="$ROOT_DIR/deploy/docker-compose.db.yml"
UFW_COMMENT="vanttagem-db-dbeaver"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

fail() {
  printf '\n[ERRO] %s\n' "$1" >&2
  exit 1
}

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

command -v docker >/dev/null 2>&1 || fail "docker nao encontrado"
command -v sudo >/dev/null 2>&1 || fail "sudo nao encontrado"
[[ -f "$ENV_FILE" ]] || fail "Arquivo $ENV_FILE nao encontrado"
[[ -f "$COMPOSE_FILE" ]] || fail "Arquivo $COMPOSE_FILE nao encontrado"

set -a
source "$ENV_FILE"
set +a

SSH_SOURCE_IP="${SSH_CONNECTION:-}"
SSH_SOURCE_IP="${SSH_SOURCE_IP%% *}"
TARGET_IP="${1:-$SSH_SOURCE_IP}"
TARGET_IP="${TARGET_IP:-${DB_ALLOWED_IP:-}}"

[[ -n "${MYSQL_DATABASE:-}" ]] || fail "MYSQL_DATABASE nao definido em $ENV_FILE"
[[ -n "${MYSQL_ROOT_PASSWORD:-}" ]] || fail "MYSQL_ROOT_PASSWORD nao definido em $ENV_FILE"
[[ -n "${MYSQL_ADMIN_USER:-}" ]] || fail "MYSQL_ADMIN_USER nao definido em $ENV_FILE"
[[ -n "${MYSQL_ADMIN_PASSWORD:-}" ]] || fail "MYSQL_ADMIN_PASSWORD nao definido em $ENV_FILE"
[[ -n "${DB_PUBLIC_PORT:-}" ]] || fail "DB_PUBLIC_PORT nao definido em $ENV_FILE"
[[ -n "$TARGET_IP" ]] || fail "Informe o IP permitido como argumento, em SSH_CONNECTION ou em DB_ALLOWED_IP"

if ! [[ "$TARGET_IP" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
  fail "IP invalido: $TARGET_IP"
fi

log "Atualizando regra local do UFW para liberar ${TARGET_IP}:${DB_PUBLIC_PORT}"
mapfile -t RULE_NUMBERS < <(
  sudo ufw status numbered | awk -v comment="$UFW_COMMENT" '
    index($0, comment) {
      gsub(/\[|\]/, "", $1)
      print $1
    }
  ' | sort -rn
)

for rule_number in "${RULE_NUMBERS[@]:-}"; do
  [[ -n "$rule_number" ]] || continue
  sudo ufw --force delete "$rule_number" >/dev/null
done

sudo ufw allow proto tcp from "$TARGET_IP" to any port "$DB_PUBLIC_PORT" comment "$UFW_COMMENT" >/dev/null

log "Atualizando usuario administrativo do MariaDB"
HOSTS="$(
  compose exec -T db mariadb -N -B -uroot "-p$MYSQL_ROOT_PASSWORD" \
    -e "SELECT Host FROM mysql.user WHERE User = '${MYSQL_ADMIN_USER}';"
)"

while IFS= read -r host; do
  [[ -n "$host" ]] || continue
  [[ "$host" == "$TARGET_IP" ]] && continue
  compose exec -T db mariadb -uroot "-p$MYSQL_ROOT_PASSWORD" \
    -e "DROP USER IF EXISTS '${MYSQL_ADMIN_USER}'@'${host}';"
done <<< "$HOSTS"

compose exec -T db mariadb -uroot "-p$MYSQL_ROOT_PASSWORD" <<SQL
CREATE USER IF NOT EXISTS '${MYSQL_ADMIN_USER}'@'${TARGET_IP}' IDENTIFIED BY '${MYSQL_ADMIN_PASSWORD}';
ALTER USER '${MYSQL_ADMIN_USER}'@'${TARGET_IP}' IDENTIFIED BY '${MYSQL_ADMIN_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${MYSQL_DATABASE}\`.* TO '${MYSQL_ADMIN_USER}'@'${TARGET_IP}';
FLUSH PRIVILEGES;
SQL

log "Regras locais aplicadas"
sudo ufw status | sed -n "/${DB_PUBLIC_PORT}/p"

printf '\nAtualize tambem o firewall externo da Contabo:\n'
printf -- '- Acao: Allow\n'
printf -- '- Protocolo: TCP\n'
printf -- '- Porta destino: %s\n' "$DB_PUBLIC_PORT"
printf -- '- Origem: %s/32\n' "$TARGET_IP"
printf -- '- Descricao: %s\n' "$UFW_COMMENT"
