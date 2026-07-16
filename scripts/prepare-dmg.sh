#!/bin/bash

# Verify the signed and notarized DMG before distribution.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔎 Verifying notarized DMG..."

# Find DMG file in the build directory
DMG_PATH=$(find "$PROJECT_ROOT/src-tauri/target/release/bundle/dmg" -name "*.dmg" -type f 2>/dev/null | head -n 1)

if [ -z "$DMG_PATH" ]; then
  echo "❌ Error: DMG file not found in build directory"
  echo "   Please build the app first with: bun run tauri build"
  exit 1
fi

echo "✅ Found DMG: $DMG_PATH"

echo "💿 Checking disk image integrity..."
hdiutil verify "$DMG_PATH"

echo "🎟️  Checking stapled notarization ticket..."
xcrun stapler validate "$DMG_PATH"

echo "🛡️  Checking Gatekeeper assessment..."
spctl --assess --type open --context context:primary-signature --verbose=2 "$DMG_PATH"

echo ""
echo "✅ DMG is signed, notarized, stapled, and ready to distribute."
