#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd -- "$ROOT"
ACTION="${1:-deploy}"
case "$ACTION" in
  init)
    for name in server frontend; do
      if [[ ! -f "deploy/$name.env" ]]; then
        cp -- "deploy/$name.env.example" "deploy/$name.env"
        printf 'Created deploy/%s.env\n' "$name"
      fi
    done
    printf 'Review deploy/server.env and deploy/frontend.env, then run: bash scripts/deploy.sh deploy\n'
    exit 0
    ;;
  deploy|status|logs|stop) ;;
  *) printf 'Usage: bash scripts/deploy.sh [init|deploy|status|logs|stop]\n' >&2; exit 2 ;;
esac
for name in server frontend; do
  [[ -f "deploy/$name.env" ]] || { printf 'Missing deploy/%s.env. Run init first.\n' "$name" >&2; exit 1; }
done
command -v docker >/dev/null || { echo 'Install Docker Engine and Docker Compose v2 first.' >&2; exit 1; }
docker compose version >/dev/null
COMPOSE=(docker compose --env-file "$ROOT/deploy/server.env" -f "$ROOT/compose.yaml")
"${COMPOSE[@]}" config --quiet
case "$ACTION" in
  deploy)
    docker info >/dev/null
    "${COMPOSE[@]}" build --pull
    "${COMPOSE[@]}" up -d --wait --wait-timeout 120
    "${COMPOSE[@]}" ps
    ;;
  status) "${COMPOSE[@]}" ps ;;
  logs) "${COMPOSE[@]}" logs --tail 100 -f web ;;
  stop) "${COMPOSE[@]}" stop web ;;
esac
