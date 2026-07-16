#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$PROJECT_ROOT/.env.notarization.local" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$PROJECT_ROOT/.env.notarization.local"
  set +a
fi

DMG_PATH="${1:-}"
[ -f "$DMG_PATH" ] || {
  echo "❌ Provide the path to an existing DMG." >&2
  exit 1
}

echo "Uploading $(basename "$DMG_PATH") to Apple's notary service..."

if [ -n "${APPLE_API_KEY:-}" ] && [ -n "${APPLE_API_KEY_PATH:-}" ]; then
  NOTARY_ARGS=(
    --key "$APPLE_API_KEY_PATH"
    --key-id "$APPLE_API_KEY"
  )
  if [ -n "${APPLE_API_ISSUER:-}" ]; then
    NOTARY_ARGS+=(--issuer "$APPLE_API_ISSUER")
  fi
elif [ -n "${APPLE_ID:-}" ] && [ -n "${APPLE_PASSWORD:-}" ] && [ -n "${APPLE_TEAM_ID:-}" ]; then
  NOTARY_ARGS=(
    --apple-id "$APPLE_ID"
    --password "$APPLE_PASSWORD"
    --team-id "$APPLE_TEAM_ID"
  )
else
  echo "❌ Complete Apple notarization credentials are required." >&2
  exit 1
fi

xcrun notarytool submit "$DMG_PATH" "${NOTARY_ARGS[@]}" --wait
xcrun stapler staple "$DMG_PATH"

echo "✅ DMG notarization accepted and ticket stapled."
