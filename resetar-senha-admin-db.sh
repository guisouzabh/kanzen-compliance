#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$ROOT_DIR/deploy/.env.db"
COMPOSE_FILE="$ROOT_DIR/deploy/docker-compose.db.yml"

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
[[ -f "$ENV_FILE" ]] || fail "Arquivo $ENV_FILE nao encontrado"
[[ -f "$COMPOSE_FILE" ]] || fail "Arquivo $COMPOSE_FILE nao encontrado"

TARGET_IP="${1:-}"
NEW_PASSWORD="${2:-}"

[[ -n "$TARGET_IP" ]] || fail "Uso: ./resetar-senha-admin-db.sh <IP> <NOVA_SENHA>"
[[ -n "$NEW_PASSWORD" ]] || fail "Uso: ./resetar-senha-admin-db.sh <IP> <NOVA_SENHA>"

if ! [[ "$TARGET_IP" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
  fail "IP invalido: $TARGET_IP"
fi

set -a
source "$ENV_FILE"
set +a

[[ -n "${MYSQL_ROOT_PASSWORD:-}" ]] || fail "MYSQL_ROOT_PASSWORD nao definido em $ENV_FILE"
[[ -n "${MYSQL_ADMIN_USER:-}" ]] || fail "MYSQL_ADMIN_USER nao definido em $ENV_FILE"
[[ -n "${MYSQL_DATABASE:-}" ]] || fail "MYSQL_DATABASE nao definido em $ENV_FILE"

log "Resetando senha do usuario admin para o host $TARGET_IP"
compose exec -T db mariadb -uroot "-p$MYSQL_ROOT_PASSWORD" <<SQL
CREATE USER IF NOT EXISTS '${MYSQL_ADMIN_USER}'@'${TARGET_IP}' IDENTIFIED BY '${NEW_PASSWORD}';
ALTER USER '${MYSQL_ADMIN_USER}'@'${TARGET_IP}' IDENTIFIED BY '${NEW_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${MYSQL_DATABASE}\`.* TO '${MYSQL_ADMIN_USER}'@'${TARGET_IP}';
FLUSH PRIVILEGES;
SQL

log "Senha resetada"
printf '\nTeste no DBeaver com:\n'
printf 'Host: 109.123.250.98\n'
printf 'Porta: 3306\n'
printf 'Database: %s\n' "$MYSQL_DATABASE"
printf 'Usuario: %s\n' "$MYSQL_ADMIN_USER"
printf 'Senha: a informada no comando\n'
