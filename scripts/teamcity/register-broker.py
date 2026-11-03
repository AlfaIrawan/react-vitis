#!/usr/bin/env python3
"""Operator-only bootstrap: allow Vitis in the existing host deployment broker.

Run on the deployment host as root after the first successful deployment.
The TeamCity agent must never execute this script with elevated permissions.
"""
import datetime
import json
import os
import pathlib
import subprocess
import tempfile

ROOT = pathlib.Path('/var/lib/tectona-ci-deploy')
DEPLOY = pathlib.Path('/opt/vitis')


def run(*args):
    return subprocess.check_output(args, text=True).strip()


def atomic_write(path, data):
    fd, name = tempfile.mkstemp(dir=path.parent)
    try:
        with os.fdopen(fd, 'w') as output:
            output.write(data)
        os.replace(name, path)
    finally:
        pathlib.Path(name).unlink(missing_ok=True)


def main():
    if os.geteuid() != 0:
        raise SystemExit('Run as root on the deployment host.')
    os.environ['VITIS_IMAGE'] = (DEPLOY / 'current-image').read_text().strip()
    compose = ['docker', 'compose', '--project-name', 'vitis', '--env-file',
               str(DEPLOY / 'server.env'), '-f', str(DEPLOY / 'compose.yaml')]
    container = run(*compose, 'ps', '--quiet', 'web')
    if not container:
        raise SystemExit('Bootstrap a healthy Vitis container first.')
    current = json.loads(run('docker', 'inspect', container))[0]
    if current['State'].get('Health', {}).get('Status') != 'healthy':
        raise SystemExit('Vitis container is not healthy.')
    image = current['Config']['Image']
    if not image.startswith('vitis-web:tc-') or not image.removeprefix('vitis-web:tc-').isdigit():
        raise SystemExit('Expected a versioned vitis-web:tc-N image.')
    os.environ['VITIS_IMAGE'] = image
    config = run(*compose, 'config', '--format', 'json')
    registry_path = ROOT / 'registry.json'
    original = registry_path.read_text()
    registry = json.loads(original)
    entry = {
        'config': str(ROOT / 'vitis.compose.json'), 'compose_service': 'web',
        'container': current['Name'].lstrip('/'), 'project': 'vitis',
        'image_repo': 'vitis-web', 'default_tag': image.split(':', 1)[1],
        'docker_healthcheck': True,
    }
    if 'vitis' in registry and registry['vitis'] != entry:
        raise SystemExit('Existing Vitis registration differs; review it before replacing.')
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    backup = ROOT / ('registry.before-vitis-' + stamp + '.json')
    atomic_write(backup, original)
    atomic_write(ROOT / 'vitis.compose.json', config + '\n')
    registry['vitis'] = entry
    atomic_write(registry_path, json.dumps(registry, indent=2) + '\n')
    try:
        subprocess.run(['systemctl', 'restart', 'tectona-ci-deploy-broker.service'], check=True)
        subprocess.run(['systemctl', 'is-active', '--quiet', 'tectona-ci-deploy-broker.service'], check=True)
        subprocess.run([
            'curl', '--fail', '--silent', '--show-error', '--retry', '5',
            '--retry-connrefused', '--retry-delay', '1', '--max-time', '5',
            '--unix-socket', '/run/tectona-ci-deploy/control.sock',
            'http://localhost/health',
        ], check=True)
    except Exception:
        atomic_write(registry_path, original)
        subprocess.run(['systemctl', 'restart', 'tectona-ci-deploy-broker.service'], check=False)
        raise
    print('Registered Vitis; previous broker entries retained. Backup: ' + str(backup))


if __name__ == '__main__':
    main()
