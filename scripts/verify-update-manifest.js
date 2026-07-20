#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const [manifestArg, expectedVersion, expectedType = ""] = process.argv.slice(2);
if (!manifestArg || !expectedVersion) {
  console.error("Usage: verify-update-manifest.js <manifest> <version> [fix|feature]");
  process.exit(1);
}

const manifestPath = resolve(manifestArg);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const mac = manifest.platforms?.["darwin-aarch64"];
const errors = [];

if (manifest.version !== expectedVersion) errors.push(`version is ${manifest.version}`);
if (expectedType && manifest.release_type !== expectedType) {
  errors.push(`release_type is ${manifest.release_type ?? "missing"}`);
}
if (!mac?.signature?.trim()) errors.push("darwin-aarch64 signature is missing");
if (!mac?.url?.includes(`/v${expectedVersion}/`)) errors.push("darwin-aarch64 URL has the wrong version");
if (!manifest.notes?.trim()) errors.push("release notes are empty");
if (Number.isNaN(Date.parse(manifest.pub_date))) errors.push("pub_date is invalid");

if (errors.length > 0) {
  console.error(`Invalid updater manifest: ${errors.join(", ")}.`);
  process.exit(1);
}

console.log(`✅ Updater manifest verified for ${expectedVersion}.`);
