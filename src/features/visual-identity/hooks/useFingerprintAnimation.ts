import { useEffect, useRef } from "react";
import {
  createAmbientAnimation,
  createResponsiveAnimation,
  applyTransformAnimation,
  type AnimationState,
} from "../utils/animation";
import type { PatternType } from "../generators/core";

interface UseFingerprintAnimationOptions {
  canvas: HTMLCanvasElement | null;
  seed: number;
  patternType: PatternType;
  isEditing?: boolean;
  enabled?: boolean;
}

/**
 * Hook for animating fingerprint patterns
 */
export function useFingerprintAnimation({
  canvas,
  seed,
  patternType,
  isEditing = false,
  enabled = true,
}: UseFingerprintAnimationOptions): void {
  const animationIdRef = useRef<number | null>(null);
  const originalImageDataRef = useRef<ImageData | null>(null);

  useEffect(() => {
    if (!canvas || !enabled) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    // Wait for canvas to have content before capturing
    const checkAndCapture = () => {
      // Check if canvas has non-transparent pixels
      const imageData = ctx.getImageData(
        0,
        0,
        Math.min(canvas.width, 100),
        Math.min(canvas.height, 100)
      );
      const hasContent = imageData.data.some((pixel, index) => {
        // Check alpha channel (every 4th byte)
        return index % 4 === 3 && pixel > 0;
      });

      if (hasContent && !originalImageDataRef.current) {
        // Capture full canvas
        originalImageDataRef.current = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        startAnimation();
      } else if (!hasContent) {
        // Retry after a short delay if canvas is still empty
        setTimeout(checkAndCapture, 100);
      } else if (originalImageDataRef.current) {
        startAnimation();
      }
    };

    const startAnimation = () => {
      // Clear previous animation
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
      }

      // Create animation based on editing state
      const onFrame = (canvas: HTMLCanvasElement, progress: number) => {
        const ctx = canvas.getContext("2d");
        if (!ctx || !originalImageDataRef.current) return;

        // Restore original image
        ctx.putImageData(originalImageDataRef.current, 0, 0);

        // Apply transform
        ctx.save();
        applyTransformAnimation(canvas, progress, patternType, seed);
        ctx.restore();
      };

      if (isEditing !== undefined) {
        animationIdRef.current = createResponsiveAnimation(
          canvas,
          seed,
          isEditing,
          onFrame
        );
      } else {
        animationIdRef.current = createAmbientAnimation(canvas, seed, onFrame);
      }
    };

    // Reset original image data when canvas changes
    originalImageDataRef.current = null;

    // Start checking for content
    checkAndCapture();

    // Cleanup
    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
      originalImageDataRef.current = null;
    };
  }, [canvas, seed, patternType, isEditing, enabled]);
}
