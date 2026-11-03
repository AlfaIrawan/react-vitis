#!/usr/bin/env python3
"""Read the config digest from a docker save stream across image-store versions."""
import hashlib
import json
import sys
import tarfile

digests = {}
manifest = None
with tarfile.open(fileobj=sys.stdin.buffer, mode='r|*') as archive:
    for member in archive:
        if not member.isfile():
            continue
        source = archive.extractfile(member)
        if member.name == 'manifest.json':
            if member.size > 1024 * 1024:
                raise SystemExit('Unexpected Docker manifest size.')
            manifest = json.load(source)
        else:
            digest = hashlib.sha256()
            while chunk := source.read(1024 * 1024):
                digest.update(chunk)
            digests[member.name] = digest.hexdigest()
if not manifest or len(manifest) != 1 or manifest[0]['Config'] not in digests:
    raise SystemExit('Expected one image and its config in the Docker save stream.')
print('sha256:' + digests[manifest[0]['Config']])
