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
[[ -x "$ROOT_DIR/atualizar-acesso-db.sh" ]] || fail "Script atualizar-acesso-db.sh nao encontrado ou sem permissao de execucao"

set -a
source "$ENV_FILE"
set +a

SSH_SOURCE_IP="${SSH_CONNECTION:-}"
SSH_SOURCE_IP="${SSH_SOURCE_IP%% *}"
TARGET_IP="${1:-${DB_ALLOWED_IP:-$SSH_SOURCE_IP}}"

[[ -n "${MYSQL_ROOT_PASSWORD:-}" ]] || fail "MYSQL_ROOT_PASSWORD nao definido em $ENV_FILE"
[[ -n "${MYSQL_ADMIN_USER:-}" ]] || fail "MYSQL_ADMIN_USER nao definido em $ENV_FILE"
[[ -n "${MYSQL_ADMIN_PASSWORD:-}" ]] || fail "MYSQL_ADMIN_PASSWORD nao definido em $ENV_FILE"
[[ -n "$TARGET_IP" ]] || fail "Informe o IP permitido como argumento ou em DB_ALLOWED_IP"

log "Reaplicando acesso do admin para $TARGET_IP"
"$ROOT_DIR/atualizar-acesso-db.sh" "$TARGET_IP"

log "Conferindo usuarios cadastrados"
compose exec -T db mariadb -N -B -uroot "-p$MYSQL_ROOT_PASSWORD" \
  -e "SELECT User,Host FROM mysql.user WHERE User IN ('${MYSQL_ADMIN_USER}', '${MYSQL_USER}');"

log "Conferindo grants do usuario administrativo"
compose exec -T db mariadb -N -B -uroot "-p$MYSQL_ROOT_PASSWORD" \
  -e "SHOW GRANTS FOR '${MYSQL_ADMIN_USER}'@'${TARGET_IP}';"

log "Reparo concluido"
