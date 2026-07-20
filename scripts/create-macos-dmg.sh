#!/bin/bash

# Recreate the macOS DMG from an already signed and notarized app bundle.
# Tauri writes its create-dmg helper before attempting the DMG, so this also
# provides a deterministic recovery path when that final bundling step fails.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$PROJECT_ROOT/.env.notarization.local" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$PROJECT_ROOT/.env.notarization.local"
  set +a
fi

fail() {
  echo "❌ $1" >&2
  exit 1
}

VERSION="${1:-}"
[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail "Provide a semantic version such as 0.1.7."
[ "$(uname -s)" = "Darwin" ] || fail "DMG creation requires macOS."

IDENTITY="${APPLE_SIGNING_IDENTITY:-}"
[ -n "$IDENTITY" ] || fail "APPLE_SIGNING_IDENTITY is required to sign the DMG."

BUNDLE_DIR="$PROJECT_ROOT/src-tauri/target/release/bundle"
APP_PATH="$BUNDLE_DIR/macos/Markd.app"
DMG_DIR="$BUNDLE_DIR/dmg"
DMG_HELPER="$DMG_DIR/bundle_dmg.sh"

[ -d "$APP_PATH" ] || fail "Signed app bundle not found at $APP_PATH."
[ -x "$DMG_HELPER" ] || fail "Tauri DMG helper not found. Run 'bunx tauri bundle --bundles dmg' once to generate it."

case "$(uname -m)" in
  arm64) DMG_ARCH="aarch64" ;;
  x86_64) DMG_ARCH="x64" ;;
  *) fail "Unsupported macOS architecture: $(uname -m)" ;;
esac

DMG_NAME="Markd_${VERSION}_${DMG_ARCH}.dmg"
DMG_PATH="$DMG_DIR/$DMG_NAME"
STAGING_DIR="$(mktemp -d "${TMPDIR:-/tmp}/markd-dmg-${VERSION}.XXXXXX")"

cleanup() {
  rm -rf "$STAGING_DIR"
}
trap cleanup EXIT

mkdir -p "$DMG_DIR"
rm -f "$DMG_PATH"
find "$DMG_DIR" -maxdepth 1 -type f -name "rw.*.${DMG_NAME}" -delete
ditto "$APP_PATH" "$STAGING_DIR/Markd.app"

DMG_ARGS=(
  --volname "Markd"
  --window-size 660 400
  --window-pos 400 400
  --icon-size 128
  --icon "Markd.app" 180 220
  --hide-extension "Markd.app"
  --app-drop-link 480 220
  --codesign "$IDENTITY"
)

if [ -f "$DMG_DIR/icon.icns" ]; then
  DMG_ARGS+=(--volicon "$DMG_DIR/icon.icns")
fi

"$DMG_HELPER" "${DMG_ARGS[@]}" "$DMG_PATH" "$STAGING_DIR"
codesign --verify --verbose=2 "$DMG_PATH"

echo "✅ Created and signed $DMG_PATH"
