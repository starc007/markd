#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const expectedVersion = process.argv[2];

if (!/^\d+\.\d+\.\d+$/.test(expectedVersion ?? "")) {
  console.error("Provide a semantic release version such as 0.1.7.");
  process.exit(1);
}

const readJson = (path) => JSON.parse(readFileSync(join(projectRoot, path), "utf8"));
const versions = new Map([
  ["package.json", readJson("package.json").version],
  ["site/package.json", readJson("site/package.json").version],
  ["src-tauri/tauri.conf.json", readJson("src-tauri/tauri.conf.json").version],
]);

const cargoToml = readFileSync(join(projectRoot, "src-tauri/Cargo.toml"), "utf8");
const cargoVersion = cargoToml.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
versions.set("src-tauri/Cargo.toml", cargoVersion);

const siteConfig = readFileSync(join(projectRoot, "site/lib/config.ts"), "utf8");
versions.set("site/lib/config.ts", siteConfig.match(/export const VERSION = "([^"]+)"/)?.[1]);

const changelog = readFileSync(join(projectRoot, "site/lib/changelog.ts"), "utf8");
versions.set("site/lib/changelog.ts latest entry", changelog.match(/version:\s*"([^"]+)"/)?.[1]);

const mismatches = [...versions].filter(([, version]) => version !== expectedVersion);
if (mismatches.length > 0) {
  for (const [path, version] of mismatches) {
    console.error(`${path} has version ${version ?? "missing"}, expected ${expectedVersion}.`);
  }
  process.exit(1);
}

console.log(`✅ Release version ${expectedVersion} matches every package configuration.`);
