#!/bin/bash

# Script to prepare DMG for distribution
# Removes quarantine attributes and prepares DMG for web distribution

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

# Remove all extended attributes including quarantine
echo "🔓 Removing quarantine and extended attributes..."
xattr -cr "$DMG_PATH" 2>/dev/null || {
  # If xattr -cr fails, try individual removal
  xattr -d com.apple.quarantine "$DMG_PATH" 2>/dev/null || true
  xattr -d com.apple.metadata:kMDItemWhereFroms "$DMG_PATH" 2>/dev/null || true
  xattr -d com.apple.metadata:kMDItemDownloadedDate "$DMG_PATH" 2>/dev/null || true
}

# Verify attributes are removed
ATTRIBUTES=$(xattr -l "$DMG_PATH" 2>/dev/null || echo "")
if [ -n "$ATTRIBUTES" ]; then
  echo "⚠️  Warning: Some extended attributes remain:"
  echo "$ATTRIBUTES"
else
  echo "✅ All extended attributes removed"
fi

echo ""
echo "✅ DMG prepared for distribution!"
echo ""
echo "📝 Important: macOS will add quarantine when users download from your website."
echo "   This is normal macOS security behavior."
echo ""
echo "💡 Users can fix this by:"
echo "   1. Right-click the DMG → Open (first time only)"
echo "   2. Or run: xattr -cr ~/Downloads/Draft_*.dmg"
echo ""
echo "📤 The DMG is ready to upload to your website!"
