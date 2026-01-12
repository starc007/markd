#!/usr/bin/env node

/**
 * Version Synchronization Script
 *
 * This script ensures version consistency across all configuration files:
 * - src-tauri/tauri.conf.json (source of truth)
 * - package.json
 * - src-tauri/Cargo.toml
 *
 * Usage:
 *   bun scripts/sync-version.js
 *
 * The script reads the version from tauri.conf.json and updates the other files.
 * This should be run before building to ensure all files have the same version.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the project root directory (one level up from scripts/)
const projectRoot = join(__dirname, "..");

/**
 * Read JSON file and parse it
 */
function readJsonFile(filePath) {
  try {
    const content = readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    process.exit(1);
  }
}

/**
 * Write JSON file with proper formatting
 */
function writeJsonFile(filePath, data) {
  try {
    const content = JSON.stringify(data, null, 2) + "\n";
    writeFileSync(filePath, content, "utf-8");
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error.message);
    process.exit(1);
  }
}

/**
 * Update version in Cargo.toml
 * Cargo.toml uses TOML format, so we need to parse and update the version line
 */
function updateCargoToml(filePath, version) {
  try {
    let content = readFileSync(filePath, "utf-8");

    // Replace the version line in the [package] section
    // Match: version = "0.1.0" (with optional whitespace)
    const versionRegex = /^(\s*version\s*=\s*")[^"]+(".*)$/m;

    if (versionRegex.test(content)) {
      content = content.replace(versionRegex, `$1${version}$2`);
      writeFileSync(filePath, content, "utf-8");
      console.log(`✓ Updated Cargo.toml version to ${version}`);
    } else {
      console.warn(`⚠ Could not find version line in Cargo.toml`);
    }
  } catch (error) {
    console.error(`Error updating Cargo.toml:`, error.message);
    process.exit(1);
  }
}

/**
 * Update version in package.json
 */
function updatePackageJson(filePath, version) {
  try {
    const packageJson = readJsonFile(filePath);

    if (packageJson.version !== version) {
      packageJson.version = version;
      writeJsonFile(filePath, packageJson);
      console.log(`✓ Updated package.json version to ${version}`);
    } else {
      console.log(`✓ package.json already has version ${version}`);
    }
  } catch (error) {
    console.error(`Error updating package.json:`, error.message);
    process.exit(1);
  }
}

/**
 * Main synchronization function
 */
function syncVersion() {
  console.log("🔄 Syncing version across configuration files...\n");

  // Read version from tauri.conf.json (source of truth)
  const tauriConfPath = join(projectRoot, "src-tauri", "tauri.conf.json");
  const tauriConf = readJsonFile(tauriConfPath);
  const version = tauriConf.version;

  if (!version) {
    console.error("❌ No version found in tauri.conf.json");
    process.exit(1);
  }

  console.log(`📦 Source version from tauri.conf.json: ${version}\n`);

  // Update package.json
  const packageJsonPath = join(projectRoot, "package.json");
  updatePackageJson(packageJsonPath, version);

  // Update Cargo.toml
  const cargoTomlPath = join(projectRoot, "src-tauri", "Cargo.toml");
  updateCargoToml(cargoTomlPath, version);

  console.log("\n✅ Version synchronization complete!");
  console.log(`   All files now use version: ${version}\n`);
}

// Run the synchronization
syncVersion();
