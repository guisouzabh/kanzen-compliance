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

[[ -n "${MYSQL_DATABASE:-}" ]] || fail "MYSQL_DATABASE nao definido em $ENV_FILE"
[[ -n "${MYSQL_USER:-}" ]] || fail "MYSQL_USER nao definido em $ENV_FILE"
[[ -n "${MYSQL_PASSWORD:-}" ]] || fail "MYSQL_PASSWORD nao definido em $ENV_FILE"
[[ -n "${MYSQL_ROOT_PASSWORD:-}" ]] || fail "MYSQL_ROOT_PASSWORD nao definido em $ENV_FILE"
[[ -n "${MYSQL_ADMIN_USER:-}" ]] || fail "MYSQL_ADMIN_USER nao definido em $ENV_FILE"
[[ -n "${MYSQL_ADMIN_PASSWORD:-}" ]] || fail "MYSQL_ADMIN_PASSWORD nao definido em $ENV_FILE"
[[ -n "${DB_PUBLIC_PORT:-}" ]] || fail "DB_PUBLIC_PORT nao definido em $ENV_FILE"
[[ -n "$TARGET_IP" ]] || fail "Informe o IP permitido como argumento ou em DB_ALLOWED_IP"

log "Garantindo rede Docker compartilhada"
docker network inspect vanttagem_shared >/dev/null 2>&1 || docker network create vanttagem_shared >/dev/null

log "Subindo o MariaDB"
compose up -d db

log "Aguardando o banco ficar pronto"
for _ in $(seq 1 30); do
  if compose exec -T db mariadb-admin ping -h 127.0.0.1 -uroot "-p$MYSQL_ROOT_PASSWORD" --silent >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 2
done

[[ "${READY:-0}" == "1" ]] || fail "MariaDB nao ficou saudavel a tempo"

log "Garantindo database e usuario da aplicacao"
compose exec -T db mariadb -uroot "-p$MYSQL_ROOT_PASSWORD" <<SQL
CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}';
ALTER USER '${MYSQL_USER}'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${MYSQL_DATABASE}\`.* TO '${MYSQL_USER}'@'%';
FLUSH PRIVILEGES;
SQL

log "Aplicando acesso administrativo para $TARGET_IP"
"$ROOT_DIR/atualizar-acesso-db.sh" "$TARGET_IP"

log "Banco provisionado"
printf '\nConexao DBeaver:\n'
printf 'Host: %s\n' "109.123.250.98"
printf 'Porta: %s\n' "$DB_PUBLIC_PORT"
printf 'Database: %s\n' "$MYSQL_DATABASE"
printf 'Usuario admin: %s\n' "$MYSQL_ADMIN_USER"
printf 'Senha admin: use o valor de MYSQL_ADMIN_PASSWORD em deploy/.env.db\n'
