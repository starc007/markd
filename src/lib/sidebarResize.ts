export const SIDEBAR_DEFAULT_WIDTH = 240;
export const SIDEBAR_MIN_WIDTH = 200;
export const SIDEBAR_MAX_WIDTH = 480;
export const SIDEBAR_KEYBOARD_STEP = 16;

export function clampSidebarWidth(width: number): number {
  if (!Number.isFinite(width)) return SIDEBAR_DEFAULT_WIDTH;
  return Math.min(
    SIDEBAR_MAX_WIDTH,
    Math.max(SIDEBAR_MIN_WIDTH, Math.round(width)),
  );
}

export function sidebarWidthFromPointer(
  startWidth: number,
  startPointerX: number,
  pointerX: number,
): number {
  return clampSidebarWidth(startWidth + pointerX - startPointerX);
}

export function sidebarWidthFromKey(
  width: number,
  key: string,
): number | null {
  switch (key) {
    case "ArrowLeft":
      return clampSidebarWidth(width - SIDEBAR_KEYBOARD_STEP);
    case "ArrowRight":
      return clampSidebarWidth(width + SIDEBAR_KEYBOARD_STEP);
    case "Home":
      return SIDEBAR_MIN_WIDTH;
    case "End":
      return SIDEBAR_MAX_WIDTH;
    default:
      return null;
  }
}
