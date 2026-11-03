#!/usr/bin/env bash
set -Eeuo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.."
: "${VITIS_DEPLOY_DIR:=/opt/vitis}"
[[ "$VITIS_DEPLOY_DIR" = /* && "$VITIS_DEPLOY_DIR" != / ]] || { echo 'Use an absolute deployment directory, not /.' >&2; exit 2; }
[[ -f "$VITIS_DEPLOY_DIR/server.env" ]] || { echo "Prepare $VITIS_DEPLOY_DIR/server.env first." >&2; exit 1; }
command -v flock >/dev/null
exec 9>"$VITIS_DEPLOY_DIR/.deploy.lock"
flock -n 9 || { echo 'Another Vitis deployment is running.' >&2; exit 1; }
docker info >/dev/null
docker compose version >/dev/null
(cd ci-in && sha256sum --check SHA256SUMS)
image="$(cat ci-in/image.ref)"
[[ "$image" =~ ^vitis-web:tc-[0-9]+$ ]] || { echo 'Invalid artifact image reference.' >&2; exit 2; }
docker image load --input ci-in/vitis-image.tar
[[ "$(docker image save "$image" | python3 scripts/teamcity/image-id.py)" = "$(cat ci-in/image.id)" ]] || { echo 'Image ID mismatch.' >&2; exit 1; }
export VITIS_IMAGE="$image"
compose=(docker compose --project-name vitis --env-file "$VITIS_DEPLOY_DIR/server.env" -f "$PWD/deploy/compose.teamcity.yaml")
"${compose[@]}" config --quiet
container="$("${compose[@]}" ps --all --quiet web)"
previous=''
if [[ -n "$container" ]]; then
  previous="$(docker inspect --format '{{.Image}}' "$container")"
fi

if "${compose[@]}" up -d --no-build --wait --wait-timeout 120; then
  "${compose[@]}" ps
  printf '%s\n' "$image" > "$VITIS_DEPLOY_DIR/current-image"
  printf 'Vitis deployed: %s\n' "$image"
else
  echo 'Deployment failed health check.' >&2
  "${compose[@]}" logs --tail 80 web >&2 || true
  if [[ -n "$previous" ]]; then
    echo "Restoring previous image: $previous" >&2
    # Tag by immutable image ID so even a moved old tag cannot change the rollback.
    docker image tag "$previous" vitis-web:rollback
    export VITIS_IMAGE=vitis-web:rollback
    "${compose[@]}" up -d --no-build --wait --wait-timeout 120 || {
      echo 'ROLLBACK FAILED: inspect Docker and TeamCity logs immediately.' >&2
      exit 1
    }
  else
    echo 'First deployment: no previous image available; removing failed service.' >&2
    "${compose[@]}" rm --stop --force web || true
  fi
  exit 1
fi
