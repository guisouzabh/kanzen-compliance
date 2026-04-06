#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_ENV_FILE="$ROOT_DIR/deploy/.env.db"
DB_COMPOSE_FILE="$ROOT_DIR/deploy/docker-compose.db.yml"
BACKEND_ENV_FILE="$ROOT_DIR/deploy/.env.backend"
BACKEND_COMPOSE_FILE="$ROOT_DIR/deploy/docker-compose.backend.yml"
LANDING_ENV_FILE="$ROOT_DIR/deploy/.env.landing"
LANDING_COMPOSE_FILE="$ROOT_DIR/deploy/docker-compose.landing.yml"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

fail() {
  printf '\n[ERRO] %s\n' "$1" >&2
  exit 1
}

db_compose() {
  docker compose --env-file "$DB_ENV_FILE" -f "$DB_COMPOSE_FILE" "$@"
}

backend_compose() {
  docker compose --env-file "$BACKEND_ENV_FILE" -f "$BACKEND_COMPOSE_FILE" "$@"
}

landing_compose() {
  docker compose --env-file "$LANDING_ENV_FILE" -f "$LANDING_COMPOSE_FILE" "$@"
}

command -v docker >/dev/null 2>&1 || fail "docker nao encontrado"
[[ -f "$DB_ENV_FILE" ]] || fail "Arquivo $DB_ENV_FILE nao encontrado"
[[ -f "$DB_COMPOSE_FILE" ]] || fail "Arquivo $DB_COMPOSE_FILE nao encontrado"
[[ -f "$BACKEND_ENV_FILE" ]] || fail "Arquivo $BACKEND_ENV_FILE nao encontrado"
[[ -f "$BACKEND_COMPOSE_FILE" ]] || fail "Arquivo $BACKEND_COMPOSE_FILE nao encontrado"

log "Garantindo rede Docker compartilhada"
docker network inspect vanttagem_shared >/dev/null 2>&1 || docker network create vanttagem_shared >/dev/null

if [[ -f "$LANDING_ENV_FILE" && -f "$LANDING_COMPOSE_FILE" ]]; then
  log "Desativando a stack legada da landing para liberar as portas 80/443"
  landing_compose down --remove-orphans || true
fi

log "Desativando a stack atual do backend para reconciliar containers orfaos"
backend_compose down --remove-orphans || true

log "Reconciliando o container do banco na rede compartilhada"
db_compose up -d db

log "Aguardando o banco ficar saudavel"
set -a
source "$DB_ENV_FILE"
set +a
READY=0
for _ in $(seq 1 30); do
  if db_compose exec -T db mariadb-admin ping -h 127.0.0.1 -uroot "-p$MYSQL_ROOT_PASSWORD" --silent >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 2
done
[[ "${READY:-0}" == "1" ]] || fail "MariaDB nao ficou saudavel a tempo"

log "Subindo landing + sistema + backend no mesmo edge"
backend_compose up -d --build --remove-orphans

log "Status da stack"
backend_compose ps

printf '\nValidacoes:\n'
printf 'Landing: https://vanttagem.com.br\n'
printf 'API legacy: https://app.vanttagem.com.br\n'
printf 'Sistema: https://sistema.vanttagem.com.br\n'
printf 'Healthcheck: https://sistema.vanttagem.com.br/healthz\n'
