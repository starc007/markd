#!/bin/bash

# Apply one deterministic Developer ID signature, notarize the final app, and
# create the updater archive from that exact verified bundle.

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
[ "$(uname -s)" = "Darwin" ] || fail "macOS app finalization requires macOS."

IDENTITY="${APPLE_SIGNING_IDENTITY:-}"
[ -n "$IDENTITY" ] || fail "APPLE_SIGNING_IDENTITY is required."
[ -n "${TAURI_SIGNING_PRIVATE_KEY:-}" ] || fail "TAURI_SIGNING_PRIVATE_KEY is required."
[ -n "${TAURI_SIGNING_PRIVATE_KEY_PASSWORD:-}" ] || fail "TAURI_SIGNING_PRIVATE_KEY_PASSWORD is required."

MACOS_DIR="$PROJECT_ROOT/src-tauri/target/release/bundle/macos"
APP_PATH="$MACOS_DIR/Markd.app"
ARCHIVE_PATH="$MACOS_DIR/Markd.app.tar.gz"
SIGNATURE_PATH="$ARCHIVE_PATH.sig"
[ -d "$APP_PATH" ] || fail "App bundle not found at $APP_PATH."

APP_VERSION=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$APP_PATH/Contents/Info.plist")
[ "$APP_VERSION" = "$VERSION" ] || fail "App version is $APP_VERSION, expected $VERSION."

echo "Applying final Developer ID signature to Markd.app..."
codesign \
  --force \
  --options runtime \
  --timestamp \
  --entitlements "$PROJECT_ROOT/src-tauri/Entitlements.plist" \
  --sign "$IDENTITY" \
  "$APP_PATH"
codesign --verify --deep --strict --verbose=2 "$APP_PATH"

NOTARY_DIR="$(mktemp -d "${TMPDIR:-/tmp}/markd-app-notary-${VERSION}.XXXXXX")"
NOTARY_ZIP="$NOTARY_DIR/Markd.app.zip"
cleanup() {
  rm -rf "$NOTARY_DIR"
}
trap cleanup EXIT

ditto -c -k --keepParent "$APP_PATH" "$NOTARY_ZIP"

if [ -n "${APPLE_API_KEY:-}" ] && [ -n "${APPLE_API_KEY_PATH:-}" ]; then
  NOTARY_ARGS=(--key "$APPLE_API_KEY_PATH" --key-id "$APPLE_API_KEY")
  if [ -n "${APPLE_API_ISSUER:-}" ]; then
    NOTARY_ARGS+=(--issuer "$APPLE_API_ISSUER")
  fi
elif [ -n "${APPLE_ID:-}" ] && [ -n "${APPLE_PASSWORD:-}" ] && [ -n "${APPLE_TEAM_ID:-}" ]; then
  NOTARY_ARGS=(--apple-id "$APPLE_ID" --password "$APPLE_PASSWORD" --team-id "$APPLE_TEAM_ID")
else
  fail "Complete Apple notarization credentials are required."
fi

echo "Submitting the final app to Apple's notary service..."
xcrun notarytool submit "$NOTARY_ZIP" "${NOTARY_ARGS[@]}" --wait
xcrun stapler staple "$APP_PATH"
codesign --verify --deep --strict --verbose=2 "$APP_PATH"
xcrun stapler validate "$APP_PATH"
spctl --assess --type execute --verbose=2 "$APP_PATH"

echo "Creating a fresh updater archive from the verified app..."
rm -f "$ARCHIVE_PATH" "$SIGNATURE_PATH"
COPYFILE_DISABLE=1 tar -czf "$ARCHIVE_PATH" -C "$MACOS_DIR" "Markd.app"
bunx tauri signer sign "$ARCHIVE_PATH"
[ -s "$ARCHIVE_PATH" ] || fail "Updater archive was not created."
[ -s "$SIGNATURE_PATH" ] || fail "Updater signature was not created."

ARCHIVE_VERSION=$(tar -xOf "$ARCHIVE_PATH" "Markd.app/Contents/Info.plist" | plutil -extract CFBundleShortVersionString raw -o - -)
[ "$ARCHIVE_VERSION" = "$VERSION" ] || fail "Updater archive version is $ARCHIVE_VERSION, expected $VERSION."

echo "✅ Final app and updater artifacts are signed and verified for $VERSION."
