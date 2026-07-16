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

fail() {
  echo "❌ $1" >&2
  exit 1
}

if [ "$(uname -s)" != "Darwin" ]; then
  fail "Markd releases must be signed and notarized on macOS."
fi

command -v security >/dev/null || fail "The macOS security tool is unavailable."
command -v xcrun >/dev/null || fail "Xcode command line tools are unavailable."
xcrun --find notarytool >/dev/null 2>&1 || fail "notarytool is unavailable. Install or select a current Xcode."
xcrun --find stapler >/dev/null 2>&1 || fail "stapler is unavailable. Install or select a current Xcode."

IDENTITY="${APPLE_SIGNING_IDENTITY:-}"
[ -n "$IDENTITY" ] || fail "APPLE_SIGNING_IDENTITY is required. Use your Developer ID Application identity."

case "$IDENTITY" in
  "Developer ID Application:"*) ;;
  *) fail "APPLE_SIGNING_IDENTITY must be a Developer ID Application certificate, not an Apple Development or ad-hoc identity." ;;
esac

security find-identity -v -p codesigning | grep -Fq "\"$IDENTITY\"" || {
  echo "Available code-signing identities:" >&2
  security find-identity -v -p codesigning >&2
  fail "APPLE_SIGNING_IDENTITY is not installed with a valid private key."
}

API_VALUES=0
[ -n "${APPLE_API_ISSUER:-}" ] && API_VALUES=$((API_VALUES + 1))
[ -n "${APPLE_API_KEY:-}" ] && API_VALUES=$((API_VALUES + 1))
[ -n "${APPLE_API_KEY_PATH:-}" ] && API_VALUES=$((API_VALUES + 1))

ID_VALUES=0
[ -n "${APPLE_ID:-}" ] && ID_VALUES=$((ID_VALUES + 1))
[ -n "${APPLE_PASSWORD:-}" ] && ID_VALUES=$((ID_VALUES + 1))
[ -n "${APPLE_TEAM_ID:-}" ] && ID_VALUES=$((ID_VALUES + 1))

if [ "$API_VALUES" -eq 3 ]; then
  [ -f "$APPLE_API_KEY_PATH" ] || fail "APPLE_API_KEY_PATH does not point to a readable App Store Connect private key."
  CREDENTIAL_KIND="App Store Connect API key"
elif [ "$ID_VALUES" -eq 3 ]; then
  CREDENTIAL_KIND="Apple ID app-specific password"
elif [ "$API_VALUES" -gt 0 ] || [ "$ID_VALUES" -gt 0 ]; then
  fail "Notarization credentials are incomplete. Set all three API key variables or all three Apple ID variables."
else
  fail "Notarization credentials are missing. See NOTARIZATION.md."
fi

echo "✅ Developer ID identity: $IDENTITY"
echo "✅ Notarization credentials: $CREDENTIAL_KIND"
echo "✅ notarytool: $(xcrun notarytool --version)"
