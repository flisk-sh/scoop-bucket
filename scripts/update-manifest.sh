#!/usr/bin/env bash
# Writes bucket/flisk.json for a release of flisk-sh/releases.
# Usage: scripts/update-manifest.sh [vX.Y.Z]   (default: the latest release)
set -euo pipefail

releases="https://github.com/flisk-sh/releases/releases"

tag="${1:-}"
if [[ -z "$tag" ]]; then
  # /releases/latest redirects to /releases/tag/<tag>, and needs no token.
  tag="$(curl -fsSLI -o /dev/null -w '%{url_effective}' "$releases/latest")"
  tag="${tag##*/}"
fi
[[ "$tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "not a release tag: $tag" >&2; exit 1; }
version="${tag#v}"

checksums="$(curl -fsSL "$releases/download/$tag/checksums.txt")"

sha() {
  local value
  value="$(awk -v name="$1" '$2 == name { print $1 }' <<<"$checksums")"
  [[ "$value" =~ ^[0-9a-f]{64}$ ]] || { echo "no checksum for $1 in $tag" >&2; exit 1; }
  echo "$value"
}

exe_hash="$(sha flisk-windows-amd64.exe)"
engine_hash="$(sha flisk-cli-engine.tar.gz)"
base="$releases/download/$tag"

mkdir -p bucket
# The engine archive has one top folder, flisk-cli, which lands next to
# flisk.exe. That is where the binary looks for it.
jq -n \
  --arg version "$version" \
  --arg exe_url "$base/flisk-windows-amd64.exe#/flisk.exe" \
  --arg engine_url "$base/flisk-cli-engine.tar.gz" \
  --arg exe_hash "$exe_hash" \
  --arg engine_hash "$engine_hash" \
  '{
    version: $version,
    description: "Run your whole app locally with one command",
    homepage: "https://flisk.sh",
    license: "MIT",
    architecture: {
      "64bit": {
        url: [$exe_url, $engine_url],
        hash: [$exe_hash, $engine_hash]
      }
    },
    bin: "flisk.exe"
  }' >bucket/flisk.json

echo "$version"
