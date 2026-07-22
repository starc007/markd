import { describe, expect, test } from "bun:test";
import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_KEYBOARD_STEP,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
  clampSidebarWidth,
  sidebarWidthFromKey,
  sidebarWidthFromPointer,
} from "../src/lib/sidebarResize";

describe("sidebar resizing", () => {
  test("clamps widths to the configurable bounds", () => {
    expect(clampSidebarWidth(SIDEBAR_MIN_WIDTH - 100)).toBe(
      SIDEBAR_MIN_WIDTH,
    );
    expect(clampSidebarWidth(SIDEBAR_MAX_WIDTH + 100)).toBe(
      SIDEBAR_MAX_WIDTH,
    );
    expect(clampSidebarWidth(321.6)).toBe(322);
  });

  test("falls back to the default for invalid persisted widths", () => {
    expect(clampSidebarWidth(Number.NaN)).toBe(SIDEBAR_DEFAULT_WIDTH);
    expect(clampSidebarWidth(Number.POSITIVE_INFINITY)).toBe(
      SIDEBAR_DEFAULT_WIDTH,
    );
  });

  test("derives pointer widths from the drag origin without drift", () => {
    expect(sidebarWidthFromPointer(240, 300, 380)).toBe(320);
    expect(sidebarWidthFromPointer(320, 380, 0)).toBe(SIDEBAR_MIN_WIDTH);
    expect(sidebarWidthFromPointer(320, 380, 900)).toBe(SIDEBAR_MAX_WIDTH);
  });

  test("supports precise keyboard resizing and boundary shortcuts", () => {
    expect(sidebarWidthFromKey(240, "ArrowLeft")).toBe(
      240 - SIDEBAR_KEYBOARD_STEP,
    );
    expect(sidebarWidthFromKey(240, "ArrowRight")).toBe(
      240 + SIDEBAR_KEYBOARD_STEP,
    );
    expect(sidebarWidthFromKey(SIDEBAR_MIN_WIDTH, "ArrowLeft")).toBe(
      SIDEBAR_MIN_WIDTH,
    );
    expect(sidebarWidthFromKey(SIDEBAR_MAX_WIDTH, "ArrowRight")).toBe(
      SIDEBAR_MAX_WIDTH,
    );
    expect(sidebarWidthFromKey(240, "Home")).toBe(SIDEBAR_MIN_WIDTH);
    expect(sidebarWidthFromKey(240, "End")).toBe(SIDEBAR_MAX_WIDTH);
    expect(sidebarWidthFromKey(240, "Enter")).toBeNull();
  });

  test("keeps the main pane usable across supported window sizes", () => {
    const minimumMainPaneWidth = 320;
    for (const viewportWidth of [800, 1200, 1920]) {
      expect(viewportWidth - SIDEBAR_MAX_WIDTH).toBeGreaterThanOrEqual(
        minimumMainPaneWidth,
      );
    }
  });
});
