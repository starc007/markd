import type { PatternType } from "../generators/core";

export interface AnimationState {
  frame: number;
  isActive: boolean;
  animationId: number | null;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Create ambient animation (slow drift when idle)
 * Returns animation frame ID
 */
export function createAmbientAnimation(
  canvas: HTMLCanvasElement,
  seed: number,
  onFrame: (canvas: HTMLCanvasElement, progress: number) => void
): number {
  if (prefersReducedMotion()) {
    return 0; // No animation
  }

  const duration = 5000 + (seed % 5000); // 5-10 seconds
  let startTime: number | null = null;

  const animate = (timestamp: number) => {
    if (startTime === null) {
      startTime = timestamp;
    }

    const elapsed = timestamp - startTime;
    const progress = (elapsed % duration) / duration; // 0-1 cycle

    onFrame(canvas, progress);

    return requestAnimationFrame(animate);
  };

  return requestAnimationFrame(animate);
}

/**
 * Create responsive animation (faster motion when editing)
 * Returns animation frame ID
 */
export function createResponsiveAnimation(
  canvas: HTMLCanvasElement,
  seed: number,
  isEditing: boolean,
  onFrame: (canvas: HTMLCanvasElement, progress: number) => void
): number {
  if (prefersReducedMotion()) {
    return 0; // No animation
  }

  const duration = isEditing ? 2000 + (seed % 1000) : 5000 + (seed % 5000); // 2-3s when editing, 5-10s when idle
  let startTime: number | null = null;
  let lastIsEditing = isEditing;

  const animate = (timestamp: number) => {
    if (startTime === null || lastIsEditing !== isEditing) {
      startTime = timestamp;
      lastIsEditing = isEditing;
    }

    const elapsed = timestamp - startTime;
    const progress = (elapsed % duration) / duration; // 0-1 cycle

    onFrame(canvas, progress);

    return requestAnimationFrame(animate);
  };

  return requestAnimationFrame(animate);
}

/**
 * Apply transform animation to canvas
 */
export function applyTransformAnimation(
  canvas: HTMLCanvasElement,
  progress: number,
  patternType: PatternType,
  seed: number
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Different animation styles per pattern type
  switch (patternType) {
    case "mesh":
      // Subtle rotation
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(progress * Math.PI * 2 * 0.1); // Slow rotation
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      break;
    case "voronoi":
      // Slight scale pulse
      const scale = 1 + Math.sin(progress * Math.PI * 2) * 0.02;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      break;
    case "waves":
      // Horizontal drift
      const offset = Math.sin(progress * Math.PI * 2) * 10;
      ctx.translate(offset, 0);
      break;
    case "sacred":
      // Rotation
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(progress * Math.PI * 2 * 0.05); // Very slow rotation
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      break;
    case "particles":
      // Subtle movement
      const moveX = Math.sin(progress * Math.PI * 2) * 5;
      const moveY = Math.cos(progress * Math.PI * 2) * 5;
      ctx.translate(moveX, moveY);
      break;
  }
}
