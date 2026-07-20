#!/bin/bash

# Verify the signed and notarized DMG before distribution.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VERSION="${1:-}"

echo "🔎 Verifying notarized DMG..."

# Find exactly one requested release DMG without selecting an older build.
if [ -n "$VERSION" ]; then
  DMG_MATCHES=()
  while IFS= read -r path; do
    DMG_MATCHES+=("$path")
  done < <(find "$PROJECT_ROOT/src-tauri/target/release/bundle/dmg" -maxdepth 1 -name "Markd_${VERSION}_*.dmg" -type f -print 2>/dev/null | sort)
else
  DMG_MATCHES=()
  while IFS= read -r path; do
    DMG_MATCHES+=("$path")
  done < <(find "$PROJECT_ROOT/src-tauri/target/release/bundle/dmg" -maxdepth 1 -name "Markd_*.dmg" -type f -print 2>/dev/null | sort)
fi

[ "${#DMG_MATCHES[@]}" -eq 1 ] || {
  echo "❌ Error: expected exactly one matching DMG, found ${#DMG_MATCHES[@]}"
  exit 1
}
DMG_PATH="${DMG_MATCHES[0]}"

echo "✅ Found DMG: $DMG_PATH"

echo "💿 Checking disk image integrity..."
hdiutil verify "$DMG_PATH"

echo "✍️  Checking Developer ID signature..."
codesign --verify --verbose=2 "$DMG_PATH"

echo "🎟️  Checking stapled notarization ticket..."
xcrun stapler validate "$DMG_PATH"

echo "🛡️  Checking Gatekeeper assessment..."
spctl --assess --type open --context context:primary-signature --verbose=2 "$DMG_PATH"

echo ""
echo "✅ DMG is signed, notarized, stapled, and ready to distribute."
