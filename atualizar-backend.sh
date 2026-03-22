#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

fail() {
  printf '\n[ERRO] %s\n' "$1" >&2
  exit 1
}

command -v git >/dev/null 2>&1 || fail "git nao encontrado"
[[ -x "$ROOT_DIR/subir-backend.sh" ]] || fail "Script subir-backend.sh nao encontrado ou sem permissao de execucao"
[[ -d "$ROOT_DIR/.git" ]] || fail "Este script precisa estar na raiz do repositorio"

cd "$ROOT_DIR"

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

log "Atualizando codigo da branch $CURRENT_BRANCH"
git pull --ff-only

log "Rebuildando a stack de landing + backend"
"$ROOT_DIR/subir-backend.sh"

log "Backend atualizado com sucesso"
