#!/usr/bin/env bash
# Exercise deployment control flow without a running Docker daemon.
set -Eeuo pipefail
root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
sandbox="$(mktemp -d)"
trap 'cat "$sandbox/result.log" >&2' ERR
trap 'rm -rf -- "$sandbox"' EXIT
mkdir -p "$sandbox/project/scripts/teamcity" "$sandbox/project/deploy" "$sandbox/project/ci-in" "$sandbox/bin" "$sandbox/server"
cp "$root/scripts/teamcity/deploy.sh" "$sandbox/project/scripts/teamcity/"
cp "$root/scripts/teamcity/image-id.py" "$sandbox/project/scripts/teamcity/"
cp "$root/deploy/compose.teamcity.yaml" "$sandbox/project/deploy/"
touch "$sandbox/server/server.env"
export VITIS_DEPLOY_DIR="$sandbox/server"
export MOCK_DOCKER_LOG="$sandbox/docker.log"
export PATH="$sandbox/bin:$PATH"
cat > "$sandbox/bin/docker" <<'MOCK'
#!/usr/bin/env bash
set -eu
printf '%s | %s\n' "$*" "${VITIS_IMAGE:-}" >> "$MOCK_DOCKER_LOG"
case "$1 ${2:-}" in
  'info '|'compose version'|'image load'|'image tag') exit 0 ;;
  'image save') cat "$MOCK_IMAGE_ARCHIVE"; exit 0 ;;
esac
if [[ "$1" = inspect ]]; then echo 'sha256:old-image'; exit 0; fi
if [[ "$1" = compose ]]; then
  case " $* " in
    *' ps --all --quiet web '*)
      [[ "${MOCK_PREVIOUS:-true}" = true ]] && echo previous-container
      exit 0 ;;
    *' up -d '*)
      if [[ "${MOCK_FAIL:-false}" = true && "${VITIS_IMAGE:-}" != vitis-web:rollback ]]; then exit 1; fi
      exit 0 ;;
    *) exit 0 ;;
  esac
fi
echo "Unexpected Docker invocation: $*" >&2
exit 2
MOCK
chmod +x "$sandbox/bin/docker"
# Git Bash lacks util-linux; locking itself is provided by Linux flock in production.
if ! command -v flock >/dev/null; then
  printf '#!/usr/bin/env bash\nexit 0\n' > "$sandbox/bin/flock"
  chmod +x "$sandbox/bin/flock"
fi
cd "$sandbox/project"
python3 - <<'PY'
import io, json, tarfile
with tarfile.open('ci-in/vitis-image.tar', 'w') as archive:
    for name, data in [('config.json', b'{}'), ('manifest.json', json.dumps([{'Config':'config.json'}]).encode())]:
        entry = tarfile.TarInfo(name)
        entry.size = len(data)
        archive.addfile(entry, io.BytesIO(data))
PY
export MOCK_IMAGE_ARCHIVE="$PWD/ci-in/vitis-image.tar"
printf 'vitis-web:tc-42\n' > ci-in/image.ref
python3 scripts/teamcity/image-id.py < ci-in/vitis-image.tar > ci-in/image.id
(cd ci-in && sha256sum vitis-image.tar image.ref image.id > SHA256SUMS)

bash scripts/teamcity/deploy.sh > "$sandbox/result.log" 2>&1
[[ "$(cat "$VITIS_DEPLOY_DIR/current-image")" = vitis-web:tc-42 ]]
echo 'PASS: successful deploy records release'

export MOCK_FAIL=true
if bash scripts/teamcity/deploy.sh > "$sandbox/result.log" 2>&1; then
  echo 'Expected deployment failure' >&2; exit 1
fi
grep -q 'image tag sha256:old-image vitis-web:rollback' "$MOCK_DOCKER_LOG"
grep -q 'Restoring previous image' "$sandbox/result.log"
echo 'PASS: failed health check restores immutable previous image and exits nonzero'

export MOCK_PREVIOUS=false
if bash scripts/teamcity/deploy.sh > "$sandbox/result.log" 2>&1; then exit 1; fi
grep -q 'rm --stop --force web' "$MOCK_DOCKER_LOG"
echo 'PASS: failed first deploy removes failed service'

printf 'corrupted\n' >> ci-in/vitis-image.tar
: > "$MOCK_DOCKER_LOG"
if bash scripts/teamcity/deploy.sh > "$sandbox/result.log" 2>&1; then exit 1; fi
if grep -q 'image load' "$MOCK_DOCKER_LOG"; then
  echo 'Corrupt artifact must not be loaded' >&2; exit 1
fi
echo 'PASS: checksum failure blocks image load'
