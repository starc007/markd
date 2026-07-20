import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { shouldShowReleaseNotes } from "../src/lib/updateRelease";

describe("update release classification", () => {
  test("installs patch releases directly", () => {
    assert.equal(
      shouldShowReleaseNotes({ currentVersion: "0.1.5", version: "0.1.6" }),
      false,
    );
  });

  test("shows notes for minor and major releases", () => {
    assert.equal(
      shouldShowReleaseNotes({ currentVersion: "0.1.5", version: "0.2.0" }),
      true,
    );
    assert.equal(
      shouldShowReleaseNotes({ currentVersion: "0.9.0", version: "1.0.0" }),
      true,
    );
  });

  test("respects an explicit manifest release type", () => {
    assert.equal(
      shouldShowReleaseNotes({
        currentVersion: "0.1.5",
        version: "0.1.6",
        rawJson: { release_type: "feature" },
      }),
      true,
    );
    assert.equal(
      shouldShowReleaseNotes({
        currentVersion: "0.1.5",
        version: "0.2.0",
        rawJson: { release_type: "fix" },
      }),
      false,
    );
  });
});
