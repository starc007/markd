#!/bin/bash

# Validate that every macOS artifact belongs to the requested version and is
# signed before updater metadata or a GitHub release can be prepared.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

fail() {
  echo "❌ $1" >&2
  exit 1
}

VERSION="${1:-}"
MODE="${2:-all}"
[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail "Provide a semantic version such as 0.1.7."
[[ "$MODE" = "app" || "$MODE" = "all" ]] || fail "Validation mode must be app or all."
[ "$(uname -s)" = "Darwin" ] || fail "macOS artifact verification requires macOS."

BUNDLE_DIR="$PROJECT_ROOT/src-tauri/target/release/bundle"
APP_PATH="$BUNDLE_DIR/macos/Markd.app"
ARCHIVE_PATH="$BUNDLE_DIR/macos/Markd.app.tar.gz"
SIGNATURE_PATH="$ARCHIVE_PATH.sig"

[ -d "$APP_PATH" ] || fail "App bundle is missing."
[ -s "$ARCHIVE_PATH" ] || fail "Updater archive is missing or empty."
[ -s "$SIGNATURE_PATH" ] || fail "Updater signature is missing or empty."

APP_VERSION=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$APP_PATH/Contents/Info.plist")
[ "$APP_VERSION" = "$VERSION" ] || fail "App version is $APP_VERSION, expected $VERSION."

ARCHIVE_VERIFY_DIR="$(mktemp -d "${TMPDIR:-/tmp}/markd-updater-verify-${VERSION}.XXXXXX")"
cleanup() {
  rm -rf "$ARCHIVE_VERIFY_DIR"
}
trap cleanup EXIT

tar -xzf "$ARCHIVE_PATH" -C "$ARCHIVE_VERIFY_DIR"
ARCHIVED_APP="$ARCHIVE_VERIFY_DIR/Markd.app"
[ -d "$ARCHIVED_APP" ] || fail "Updater archive does not contain Markd.app."
ARCHIVE_VERSION=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$ARCHIVED_APP/Contents/Info.plist")
[ "$ARCHIVE_VERSION" = "$VERSION" ] || fail "Updater archive version is $ARCHIVE_VERSION, expected $VERSION."
codesign --verify --deep --strict --verbose=2 "$APP_PATH"
xcrun stapler validate "$APP_PATH"
spctl --assess --type execute --verbose=2 "$APP_PATH"
codesign --verify --deep --strict --verbose=2 "$ARCHIVED_APP"
xcrun stapler validate "$ARCHIVED_APP"
spctl --assess --type execute --verbose=2 "$ARCHIVED_APP"

if [ "$MODE" = "all" ]; then
  DMG_MATCHES=()
  while IFS= read -r path; do
    DMG_MATCHES+=("$path")
  done < <(find "$BUNDLE_DIR/dmg" -maxdepth 1 -type f -name "Markd_${VERSION}_*.dmg" -print | sort)

  [ "${#DMG_MATCHES[@]}" -eq 1 ] || fail "Expected exactly one DMG for $VERSION, found ${#DMG_MATCHES[@]}."
  DMG_PATH="${DMG_MATCHES[0]}"
  hdiutil verify "$DMG_PATH"
  codesign --verify --verbose=2 "$DMG_PATH"
  xcrun stapler validate "$DMG_PATH"
  spctl --assess --type open --context context:primary-signature --verbose=2 "$DMG_PATH"
fi

echo "✅ macOS release artifacts verified for $VERSION ($MODE)."
