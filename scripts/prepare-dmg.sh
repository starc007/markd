#!/bin/bash

# Script to prepare DMG for distribution
# Removes quarantine attributes so users can download and use it directly

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "📦 Preparing DMG for distribution..."

# Find DMG file in the build directory
DMG_PATH=$(find "$PROJECT_ROOT/src-tauri/target/release/bundle/dmg" -name "*.dmg" -type f 2>/dev/null | head -n 1)

if [ -z "$DMG_PATH" ]; then
  echo "❌ Error: DMG file not found in build directory"
  echo "   Please build the app first with: bun run tauri build"
  exit 1
fi

echo "✅ Found DMG: $DMG_PATH"

# Remove quarantine attribute (this is what causes "corrupted" errors)
echo "🔓 Removing quarantine attributes..."
xattr -d com.apple.quarantine "$DMG_PATH" 2>/dev/null || {
  echo "   (No quarantine attribute found - this is fine)"
}

# Remove all extended attributes that might cause issues
xattr -c "$DMG_PATH" 2>/dev/null || true

echo "✅ DMG prepared for distribution!"
echo ""
echo "📝 Note: Users may need to:"
echo "   1. Right-click the DMG → Open (first time only)"
echo "   2. Or go to System Settings → Privacy & Security → Allow"
echo ""
echo "💡 The DMG is ready to upload to your website!"
