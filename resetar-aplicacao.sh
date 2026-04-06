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

read_project_name() {
  local env_file="$1"
  local default_name="$2"
  local value

  value="$(grep -E '^COMPOSE_PROJECT_NAME=' "$env_file" | tail -n1 | cut -d= -f2- || true)"
  value="${value%$'\r'}"
  printf '%s' "${value:-$default_name}"
}

remove_container_if_present() {
  local container_name="$1"

  if docker container inspect "$container_name" >/dev/null 2>&1; then
    log "Removendo container legado $container_name"
    docker rm -f "$container_name" >/dev/null
  fi
}

remove_volume_if_present() {
  local volume_name="$1"

  if docker volume inspect "$volume_name" >/dev/null 2>&1; then
    log "Removendo volume de edge $volume_name"
    docker volume rm "$volume_name" >/dev/null
  fi
}

command -v docker >/dev/null 2>&1 || fail "docker nao encontrado"
[[ -f "$DB_ENV_FILE" ]] || fail "Arquivo $DB_ENV_FILE nao encontrado"
[[ -f "$DB_COMPOSE_FILE" ]] || fail "Arquivo $DB_COMPOSE_FILE nao encontrado"
[[ -f "$BACKEND_ENV_FILE" ]] || fail "Arquivo $BACKEND_ENV_FILE nao encontrado"
[[ -f "$BACKEND_COMPOSE_FILE" ]] || fail "Arquivo $BACKEND_COMPOSE_FILE nao encontrado"

cd "$ROOT_DIR"

BACKEND_PROJECT_NAME="$(read_project_name "$BACKEND_ENV_FILE" "vanttagem-landing")"
LANDING_PROJECT_NAME="$BACKEND_PROJECT_NAME"
if [[ -f "$LANDING_ENV_FILE" ]]; then
  LANDING_PROJECT_NAME="$(read_project_name "$LANDING_ENV_FILE" "$BACKEND_PROJECT_NAME")"
fi

log "Garantindo rede Docker compartilhada"
docker network inspect vanttagem_shared >/dev/null 2>&1 || docker network create vanttagem_shared >/dev/null

if [[ -f "$LANDING_ENV_FILE" && -f "$LANDING_COMPOSE_FILE" ]]; then
  log "Desativando a stack legada da landing"
  landing_compose down --remove-orphans || true
fi

log "Desativando a stack atual do backend"
backend_compose down --remove-orphans || true

log "Removendo ingresses antigos da Vanttagem ainda presos nas portas 80/443"
while IFS= read -r container_name; do
  [[ -n "$container_name" ]] || continue
  remove_container_if_present "$container_name"
done < <(
  docker ps -a --format '{{.Names}}\t{{.Ports}}' \
    | awk '$1 ~ /vanttagem/ && $0 ~ /(0\.0\.0\.0:80->|0\.0\.0\.0:443->)/ { print $1 }'
)

remove_volume_if_present "${BACKEND_PROJECT_NAME}_caddy_data"
remove_volume_if_present "${BACKEND_PROJECT_NAME}_caddy_config"

if [[ "$LANDING_PROJECT_NAME" != "$BACKEND_PROJECT_NAME" ]]; then
  remove_volume_if_present "${LANDING_PROJECT_NAME}_caddy_data"
  remove_volume_if_present "${LANDING_PROJECT_NAME}_caddy_config"
fi

remove_volume_if_present "vanttagem_caddy_data"
remove_volume_if_present "vanttagem_caddy_config"

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
[[ "$READY" == "1" ]] || fail "MariaDB nao ficou saudavel a tempo"

log "Subindo a stack limpa de landing + app + backend"
backend_compose up -d --build --remove-orphans

log "Status final da stack"
backend_compose ps

printf '\nValidacoes sugeridas:\n'
printf 'curl -I https://vanttagem.com.br\n'
printf 'curl -I https://app.vanttagem.com.br\n'
printf 'curl -I https://app.vanttagem.com.br/healthz\n'
printf 'curl https://vanttagem.com.br/api/v1/public/diagnostico/perguntas\n'
