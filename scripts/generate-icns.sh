#!/bin/bash

# Generate .icns file for macOS
# This script uses tauricon to generate the icon.icns file from icon.png

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ICONS_DIR="$PROJECT_ROOT/src-tauri/icons"
ICON_SOURCE="$ICONS_DIR/icon.png"

echo "🎨 Generating .icns file for macOS..."

# Check if icon.png exists
if [ ! -f "$ICON_SOURCE" ]; then
  echo "❌ Error: icon.png not found at $ICON_SOURCE"
  echo "   Please ensure you have a high-quality PNG icon (1240x1240+ recommended)"
  exit 1
fi

# Check if tauricon is available
if ! command -v tauricon &> /dev/null && ! command -v bunx &> /dev/null && ! command -v npx &> /dev/null; then
  echo "📦 Installing tauricon..."
  
  # Try to install tauricon
  if command -v bun &> /dev/null; then
    bun add -g github:tauri-apps/tauricon || {
      echo "⚠️  Could not install tauricon globally, trying bunx..."
      USE_BUNX=true
    }
  elif command -v npm &> /dev/null; then
    npm install -g github:tauri-apps/tauricon || {
      echo "⚠️  Could not install tauricon globally, trying npx..."
      USE_NPX=true
    }
  else
    echo "❌ Error: Need bun, npm, or npx to run tauricon"
    exit 1
  fi
fi

# Generate .icns file
echo "🔄 Running tauricon..."
# tauricon needs to run from project root to find tauri.conf.json
# It will automatically detect the icons directory and generate icon.icns there
cd "$PROJECT_ROOT"

if [ "$USE_BUNX" = true ] || command -v bunx &> /dev/null; then
  bunx github:tauri-apps/tauricon "$ICON_SOURCE" 2>&1 | grep -v "Cannot use same file" || true
elif [ "$USE_NPX" = true ] || command -v npx &> /dev/null; then
  npx github:tauri-apps/tauricon "$ICON_SOURCE" 2>&1 | grep -v "Cannot use same file" || true
else
  tauricon "$ICON_SOURCE" 2>&1 | grep -v "Cannot use same file" || true
fi

# Check if icon.icns was created
if [ -f "$ICONS_DIR/icon.icns" ]; then
  echo "✅ Successfully generated icon.icns"
  echo "   Location: $ICONS_DIR/icon.icns"
else
  echo "❌ Error: icon.icns was not generated"
  exit 1
fi

echo ""
echo "📋 Next steps:"
echo "   1. Verify icon.icns exists in src-tauri/icons/"
echo "   2. Create dmg-background.png (660x400) in src-tauri/"
echo "   3. Build your app: bun run tauri build"
echo ""
