#!/bin/bash

# Release script for Markd
# This script automates the release process: build, prepare, and generate update manifest

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$PROJECT_ROOT/.env.notarization.local" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$PROJECT_ROOT/.env.notarization.local"
  set +a
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if version and notes are provided
if [ $# -lt 2 ]; then
  echo -e "${RED}❌ Error: Missing arguments${NC}"
  echo ""
  echo "Usage: $0 <version> <release-notes>"
  echo ""
  echo "Example:"
  echo "  $0 \"0.1.1\" \"Bug fixes and improvements\""
  exit 1
fi

VERSION=$1
NOTES="${@:2}" # All remaining arguments as release notes

echo -e "${GREEN}🚀 Starting release process for version ${VERSION}${NC}"
echo ""

# Step 0: Verify Developer ID signing and notarization credentials
echo -e "${YELLOW}🔐 Step 0: Checking macOS release credentials...${NC}"
cd "$PROJECT_ROOT"
bun run release:check
echo ""

# Step 1: Build, sign, notarize, and staple the app
echo -e "${YELLOW}📦 Step 1: Building and notarizing app...${NC}"

# Check if private key is set for signing updates
if [ -z "$TAURI_SIGNING_PRIVATE_KEY" ]; then
  echo -e "${YELLOW}ℹ️  Note: TAURI_SIGNING_PRIVATE_KEY not set. Updates will not be signed.${NC}"
  echo "   To sign updates, set TAURI_SIGNING_PRIVATE_KEY to the key or its path."
  echo "   See UPDATE_KEYS_EXPLAINED.md for details"
  echo ""
fi

bun run tauri build

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Build failed!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Signed and notarized build completed${NC}"
echo ""

# Step 2: Verify the notarized DMG
echo -e "${YELLOW}🔎 Step 2: Verifying notarized DMG...${NC}"
bun run prepare:dmg

echo ""

# Step 3: Generate update manifest
echo -e "${YELLOW}📝 Step 3: Generating update manifest...${NC}"
bun run update:generate "$VERSION" "$NOTES"

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Failed to generate update manifest!${NC}"
  exit 1
fi

echo ""

# Step 3.5: Stage artifacts into the website (site/public serves them as-is).
echo -e "${YELLOW}🌐 Step 3.5: Staging artifacts into the website...${NC}"
SITE_UPDATES="$PROJECT_ROOT/site/public/updates"
SITE_DOWNLOADS="$PROJECT_ROOT/site/public/downloads"
mkdir -p "$SITE_UPDATES" "$SITE_DOWNLOADS"

STAGE_DMG=$(find "$PROJECT_ROOT/src-tauri/target/release/bundle/dmg" -name "*.dmg" -type f 2>/dev/null | head -n 1)
STAGE_BUNDLE=$(find "$PROJECT_ROOT/src-tauri/target/release/bundle/macos" -name "*.tar.gz" -type f 2>/dev/null | head -n 1)

cp "$PROJECT_ROOT/latest.json" "$SITE_UPDATES/latest.json"
[ -n "$STAGE_BUNDLE" ] && cp "$STAGE_BUNDLE" "$SITE_UPDATES/"
[ -n "$STAGE_DMG" ] && cp "$STAGE_DMG" "$SITE_DOWNLOADS/"

echo -e "${GREEN}✅ Staged latest.json + bundles into site/public${NC}"
echo -e "   ${YELLOW}Deploy with: cd site && bun run deploy${NC}"
echo ""

# Step 4: Show summary
echo -e "${GREEN}✅ Release process completed!${NC}"
echo ""
echo -e "${YELLOW}📋 Files ready for upload:${NC}"
echo ""

# Find DMG file
DMG_PATH=$(find "$PROJECT_ROOT/src-tauri/target/release/bundle/dmg" -name "*.dmg" -type f 2>/dev/null | head -n 1)
if [ -n "$DMG_PATH" ]; then
  echo -e "  ${GREEN}✓${NC} DMG: $DMG_PATH"
  echo "     → Upload to: /downloads/$(basename "$DMG_PATH")"
else
  echo -e "  ${YELLOW}⚠${NC}  DMG not found"
fi

# Find update bundle
UPDATE_BUNDLE=$(find "$PROJECT_ROOT/src-tauri/target/release/bundle/macos" -name "*.tar.gz" -type f 2>/dev/null | head -n 1)
if [ -n "$UPDATE_BUNDLE" ]; then
  echo -e "  ${GREEN}✓${NC} Update bundle: $UPDATE_BUNDLE"
  echo "     → Upload to: /updates/$(basename "$UPDATE_BUNDLE")"
else
  echo -e "  ${YELLOW}⚠${NC}  Update bundle not found"
fi

# Check for latest.json
if [ -f "$PROJECT_ROOT/latest.json" ]; then
  echo -e "  ${GREEN}✓${NC} Update manifest: $PROJECT_ROOT/latest.json"
  echo "     → Upload to: /updates/latest.json"
else
  echo -e "  ${RED}✗${NC}  Update manifest not found"
fi

echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "  1. Review the generated files"
echo "  2. Upload files to your website (see PUBLIC_DISTRIBUTION.md)"
echo "  3. Update your download page with the new version"
echo "  4. Test the download and update flow"
echo ""
