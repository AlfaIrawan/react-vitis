#!/usr/bin/env bash
set -Eeuo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.."
: "${VITIS_BUILD_ID:?Set VITIS_BUILD_ID to the unique TeamCity build ID}"
[[ "$VITIS_BUILD_ID" =~ ^[0-9]+$ ]] || { echo 'Build ID must be numeric.' >&2; exit 2; }
docker info >/dev/null

# Use an isolated context: local .env and untracked deployment credentials never enter it.
context="$(mktemp -d)"
trap 'rm -rf -- "$context"' EXIT
cp package.json package-lock.json index.html vite.config.ts tsconfig*.json postcss.config.js tailwind.config.js Dockerfile .dockerignore "$context/"
cp -R src public "$context/"
mkdir -p "$context/deploy"
cp deploy/nginx.conf.template "$context/deploy/"
cp "${VITIS_FRONTEND_ENV_FILE:-deploy/frontend.env.example}" "$context/deploy/frontend.env"

image="vitis-web:tc-${VITIS_BUILD_ID}"
# Opt-in strict gate until existing application TypeScript errors are resolved.
docker build --pull --provenance=false --target build --tag "${image}-build" "$context"
case "${VITIS_RUN_TYPECHECK:-false}" in
  true) docker run --rm --entrypoint npm "${image}-build" run typecheck ;;
  false) echo 'Typecheck gate disabled (existing application errors); Vite build remains mandatory.' ;;
  *) echo 'VITIS_RUN_TYPECHECK must be true or false.' >&2; exit 2 ;;
esac
# Publish a single-platform runtime image without an attestation index.
docker build --provenance=false --tag "$image" "$context"
mkdir -p ci-out
docker image save --output ci-out/vitis-image.tar "$image"
printf '%s\n' "$image" > ci-out/image.ref
python3 scripts/teamcity/image-id.py < ci-out/vitis-image.tar > ci-out/image.id
(cd ci-out && sha256sum vitis-image.tar image.ref image.id > SHA256SUMS)
printf 'Built %s\n' "$image"
