#!/usr/bin/env bash
# Target the existing restricted deployment broker on 10.100.0.143.
set -Eeuo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.."
socket="${VITIS_BROKER_SOCKET:-/run/tectona-ci-deploy/control.sock}"
[[ -S "$socket" ]] || { echo "Deployment broker socket missing: $socket" >&2; exit 1; }
(cd ci-in && sha256sum --check SHA256SUMS)
image="$(cat ci-in/image.ref)"
[[ "$image" =~ ^vitis-web:tc-[0-9]+$ ]] || { echo 'Invalid artifact image reference.' >&2; exit 2; }
# Docker here is the isolated rootless builder, never the host runtime daemon.
docker image load --input ci-in/vitis-image.tar
[[ "$(docker image save "$image" | python3 scripts/teamcity/image-id.py)" = "$(cat ci-in/image.id)" ]] || {
  echo 'Image ID mismatch.' >&2; exit 1;
}
printf -v body '{"service":"vitis","image_tag":"%s"}' "${image#vitis-web:}"
curl --fail-with-body --silent --show-error --max-time 600 \
  --unix-socket "$socket" -H 'Content-Type: application/json' \
  --data "$body" http://localhost/deploy
printf '\nVitis deployed through the server broker: %s\n' "$image"
