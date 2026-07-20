import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const projectRoot = join(import.meta.dir, "..");
const projectVersion = JSON.parse(readFileSync(join(projectRoot, "package.json"), "utf8")).version;
const tempDirs: string[] = [];

afterEach(() => {
  for (const path of tempDirs.splice(0)) rmSync(path, { recursive: true, force: true });
});

function run(args: string[]) {
  return Bun.spawnSync(args, { cwd: projectRoot, stderr: "pipe", stdout: "pipe" });
}

describe("release script validation", () => {
  test("accepts the synchronized project version", () => {
    const result = run(["bun", "scripts/verify-release-version.js", projectVersion]);
    expect(result.exitCode).toBe(0);
  });

  test("rejects a mismatched project version", () => {
    const result = run(["bun", "scripts/verify-release-version.js", "9.9.9"]);
    expect(result.exitCode).not.toBe(0);
  });

  test("validates updater version, type, URL, and signature", () => {
    const dir = mkdtempSync(join(tmpdir(), "markd-manifest-test-"));
    tempDirs.push(dir);
    const manifestPath = join(dir, "latest.json");
    writeFileSync(
      manifestPath,
      JSON.stringify({
        version: projectVersion,
        notes: "New release",
        pub_date: new Date().toISOString(),
        release_type: "feature",
        platforms: {
          "darwin-aarch64": {
            signature: "signed",
            url: `https://github.com/starc007/markd/releases/download/v${projectVersion}/Markd.app.tar.gz`,
          },
        },
      }),
    );

    const result = run([
      "bun",
      "scripts/verify-update-manifest.js",
      manifestPath,
      projectVersion,
      "feature",
    ]);
    expect(result.exitCode).toBe(0);
  });

  test("rejects stale updater metadata", () => {
    const dir = mkdtempSync(join(tmpdir(), "markd-manifest-test-"));
    tempDirs.push(dir);
    const manifestPath = join(dir, "latest.json");
    writeFileSync(
      manifestPath,
      JSON.stringify({
        version: "0.0.0",
        notes: "Old release",
        pub_date: new Date().toISOString(),
        release_type: "fix",
        platforms: {},
      }),
    );

    const result = run([
      "bun",
      "scripts/verify-update-manifest.js",
      manifestPath,
      projectVersion,
      "feature",
    ]);
    expect(result.exitCode).not.toBe(0);
  });
});
