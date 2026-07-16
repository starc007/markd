#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const [version, signaturePath, outputPath, notes = `Markd ${version}`] =
  process.argv.slice(2);

if (!version || !signaturePath || !outputPath) {
  console.error(
    "Usage: bun scripts/generate-linux-update-manifest.js <version> <signature> <output> [notes]",
  );
  process.exit(1);
}

const normalizedVersion = version.replace(/^v/, "");
const fileName = `Markd_${normalizedVersion}_amd64.AppImage`;
const manifest = {
  version: normalizedVersion,
  notes,
  pub_date: new Date().toISOString(),
  platforms: {
    "linux-x86_64": {
      signature: readFileSync(resolve(signaturePath), "utf8").trim(),
      url: `https://github.com/starc007/markd/releases/download/v${normalizedVersion}/${fileName}`,
    },
  },
};

const resolvedOutput = resolve(outputPath);
mkdirSync(dirname(resolvedOutput), { recursive: true });
writeFileSync(resolvedOutput, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated ${resolvedOutput}`);
