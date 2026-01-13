#!/usr/bin/env node

/**
 * Generate latest.json for Custom Update Server
 *
 * This script generates the latest.json manifest file needed for Tauri updates.
 * It reads the signature files and creates a properly formatted JSON file.
 *
 * Usage:
 *   bun scripts/generate-latest-json.js <version> <notes>
 *
 * Example:
 *   bun scripts/generate-latest-json.js "0.1.1" "Bug fixes and improvements"
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// Configuration - Update these with your website URL
// For Next.js: Use /api/updates if serving through API routes, or /updates if using public folder
const WEBSITE_URL = "https://usedraft.app/updates"; // Update this to your actual website URL
const APP_NAME = "Draft";

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: bun scripts/generate-latest-json.js <version> <notes>");
  console.error(
    'Example: bun scripts/generate-latest-json.js "0.1.1" "Bug fixes"'
  );
  process.exit(1);
}

const version = args[0];
const notes = args.slice(1).join(" "); // Join remaining args as notes
const pubDate = new Date().toISOString();

// Paths to signature files (adjust these based on your build output structure)
const buildDir = join(projectRoot, "src-tauri", "target", "release", "bundle");

// Helper function to read signature file
function readSignature(filePath) {
  try {
    const content = readFileSync(filePath, "utf-8").trim();
    return content;
  } catch (error) {
    console.warn(`⚠ Warning: Could not read signature file: ${filePath}`);
    console.warn(`  Error: ${error.message}`);
    return null;
  }
}

// Find signature files - Tauri generates these when building update bundles
// Note: Signature files are only created when you build with the updater plugin
// and create update bundles (not just DMG files)
const macosSigPath = join(buildDir, "macos", `${APP_NAME}.app.tar.gz.sig`);
const windowsSigPath = join(
  buildDir,
  "nsis",
  `${APP_NAME}_${version}_x64-setup.nsis.zip.sig`
);
const linuxSigPath = join(
  buildDir,
  "appimage",
  `${APP_NAME}_${version}_amd64.AppImage.tar.gz.sig`
);

// Also try alternative paths (Tauri v2 might use different structure)
const macosSigPathAlt = join(
  buildDir,
  "macos",
  `${APP_NAME}_${version}_aarch64.app.tar.gz.sig`
);
const macosSigPathAlt2 = join(
  buildDir,
  "macos",
  `${APP_NAME}_${version}_x64.app.tar.gz.sig`
);

console.log("📦 Generating latest.json for version", version);
console.log("");

// Read signatures (try multiple paths for macOS)
let macosSig = readSignature(macosSigPath);
if (!macosSig) {
  macosSig = readSignature(macosSigPathAlt);
}
if (!macosSig) {
  macosSig = readSignature(macosSigPathAlt2);
}

const windowsSig = readSignature(windowsSigPath);
const linuxSig = readSignature(linuxSigPath);

// Build the latest.json structure
const latestJson = {
  version,
  notes,
  pub_date: pubDate,
  platforms: {},
};

// Add macOS platforms (Intel and Apple Silicon)
if (macosSig) {
  latestJson.platforms["darwin-x86_64"] = {
    signature: macosSig,
    url: `${WEBSITE_URL}/${APP_NAME}.app.tar.gz`,
  };
  latestJson.platforms["darwin-aarch64"] = {
    signature: macosSig,
    url: `${WEBSITE_URL}/${APP_NAME}.app.tar.gz`,
  };
  console.log("✓ Added macOS (Intel & Apple Silicon) platform");
} else {
  console.warn("⚠ Skipping macOS (signature file not found)");
}

// Add Windows platform
if (windowsSig) {
  latestJson.platforms["windows-x86_64"] = {
    signature: windowsSig,
    url: `${WEBSITE_URL}/${APP_NAME}_${version}_x64-setup.nsis.zip`,
  };
  console.log("✓ Added Windows platform");
} else {
  console.warn("⚠ Skipping Windows (signature file not found)");
}

// Add Linux platform
if (linuxSig) {
  latestJson.platforms["linux-x86_64"] = {
    signature: linuxSig,
    url: `${WEBSITE_URL}/${APP_NAME}_${version}_amd64.AppImage.tar.gz`,
  };
  console.log("✓ Added Linux platform");
} else {
  console.warn("⚠ Skipping Linux (signature file not found)");
}

// Write the file
const outputPath = join(projectRoot, "latest.json");
writeFileSync(outputPath, JSON.stringify(latestJson, null, 2) + "\n", "utf-8");

console.log("");
console.log("✅ Generated latest.json");
console.log(`   Location: ${outputPath}`);
console.log("");

// Check if any platforms were added
const platformCount = Object.keys(latestJson.platforms).length;
if (platformCount === 0) {
  console.log("⚠️  Warning: No platforms were added to latest.json");
  console.log("");
  console.log("📝 This usually means:");
  console.log(
    "   1. Signature files were not found (they're generated during build)"
  );
  console.log("   2. You may need to build update bundles, not just DMG files");
  console.log("   3. For manual updates, you can edit latest.json manually");
  console.log("");
  console.log("💡 To generate signature files:");
  console.log("   - Build with: bun run tauri build");
  console.log(
    "   - Signature files are created automatically by Tauri updater plugin"
  );
  console.log("   - They're located in: src-tauri/target/release/bundle/");
} else {
  console.log("📋 Next steps:");
  console.log("   1. Review the generated latest.json file");
  console.log("   2. Update WEBSITE_URL in this script if needed");
  console.log(
    "   3. Upload latest.json to your website at:",
    `${WEBSITE_URL}/latest.json`
  );
  console.log(
    "   4. Upload the update bundles (.tar.gz, .zip files) to your website"
  );
}
console.log("");
