#!/usr/bin/env bash
# Run once on the Linux host where the TeamCity agent and Vitis will run.
set -Eeuo pipefail
root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
agent_user="${1:?Usage: sudo bash scripts/teamcity/setup-server.sh AGENT_OS_USER [/opt/vitis]}"
deploy_dir="${2:-/opt/vitis}"
[[ "$(uname -s)" = Linux ]] || { echo 'Run this on the Linux deployment server.' >&2; exit 2; }
[[ "$EUID" = 0 ]] || { echo 'Run setup with sudo.' >&2; exit 2; }
[[ "$deploy_dir" = /* && "$deploy_dir" != / ]] || { echo 'Use an absolute deployment directory, not /.' >&2; exit 2; }
id "$agent_user" >/dev/null
for tool in docker flock sha256sum; do command -v "$tool" >/dev/null; done
docker info >/dev/null
docker compose version
docker compose up --help | grep -q -- '--wait-timeout' || {
  echo 'Upgrade Docker Compose: --wait-timeout support is required.' >&2; exit 1;
}
install -d -o "$agent_user" -g "$(id -gn "$agent_user")" -m 750 "$deploy_dir"
if [[ ! -e "$deploy_dir/server.env" ]]; then
  install -o "$agent_user" -g "$(id -gn "$agent_user")" -m 600 \
    "$root/deploy/server.env.example" "$deploy_dir/server.env"
else
  echo 'Keeping existing server.env.'
fi
cat <<EOF
Prepared $deploy_dir for agent OS user $agent_user.
Review $deploy_dir/server.env before deploying (default port: 5182).
The agent user must have Docker daemon access.
Add these lines to the target agent conf/buildAgent.properties, then restart it:
vitis.build=true
vitis.deploy=true
vitis.target=10.100.0.143
Set env.VITIS_DEPLOY_DIR=$deploy_dir in TeamCity if using a custom path.
EOF
