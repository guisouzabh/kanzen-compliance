#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$ROOT_DIR/deploy/.env.landing"
COMPOSE_FILE="$ROOT_DIR/deploy/docker-compose.landing.yml"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

fail() {
  printf '\n[ERRO] %s\n' "$1" >&2
  exit 1
}

command -v git >/dev/null 2>&1 || fail "git nao encontrado"
command -v docker >/dev/null 2>&1 || fail "docker nao encontrado"

[[ -f "$ENV_FILE" ]] || fail "Arquivo $ENV_FILE nao encontrado"
[[ -f "$COMPOSE_FILE" ]] || fail "Arquivo $COMPOSE_FILE nao encontrado"
[[ -d "$ROOT_DIR/.git" ]] || fail "Este script precisa estar na raiz do repositorio"

cd "$ROOT_DIR"

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

log "Atualizando codigo da branch $CURRENT_BRANCH"
git pull --ff-only

log "Rebuildando e subindo a landing"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build

log "Status da stack"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

log "Landing atualizada com sucesso"
