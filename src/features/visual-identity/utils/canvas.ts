import {
  generateGradient,
  hashToSeeds,
  selectPatternType,
  type PatternType,
} from "../generators/core";
import { generateMesh } from "../generators/mesh";
import { generateVoronoi } from "../generators/voronoi";
import { generateWaves } from "../generators/waves";
import { generateSacred } from "../generators/sacred";
import { generateParticles } from "../generators/particles";

export interface FingerprintData {
  gradientColors: string[];
  patternType: PatternType;
  patternData: Record<string, unknown>;
  imageData?: string; // Base64 encoded
}

/**
 * Create a canvas element
 */
export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Render canvas to base64 image data
 */
export function renderToBase64(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png");
}

/**
 * Generate fingerprint pattern on canvas
 */
export function generateFingerprintPattern(
  canvas: HTMLCanvasElement,
  seeds: number[],
  patternType: PatternType
): FingerprintData {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Generate gradient
  const gradient = generateGradient(seeds);
  const gradientObj = ctx.createLinearGradient(0, 0, width, height);
  gradient.colors.forEach((color, i) => {
    gradientObj.addColorStop(i / (gradient.colors.length - 1), color);
  });

  // Fill background with gradient
  ctx.fillStyle = gradientObj;
  ctx.fillRect(0, 0, width, height);

  // Generate pattern data
  const patternData = {
    type: patternType,
    seed: seeds[0],
    colors: gradient.colors,
  };

  // Generate pattern based on type
  switch (patternType) {
    case "mesh":
      generateMesh(ctx, width, height, patternData);
      break;
    case "voronoi":
      generateVoronoi(ctx, width, height, patternData);
      break;
    case "waves":
      generateWaves(ctx, width, height, patternData);
      break;
    case "sacred":
      generateSacred(ctx, width, height, patternData);
      break;
    case "particles":
      generateParticles(ctx, width, height, patternData);
      break;
  }

  return {
    gradientColors: gradient.colors,
    patternType,
    patternData,
  };
}

/**
 * Generate complete fingerprint from note data
 */
export async function generateFingerprint(
  noteId: string,
  title: string,
  content: string,
  size: number,
  hash?: string
): Promise<FingerprintData> {
  // If hash is provided, use it; otherwise generate from title + content
  const hashString = hash || `${title}${content}`;
  const seeds = hashToSeeds(hashString);
  const patternType = selectPatternType(seeds[0]);

  // Create canvas
  const canvas = createCanvas(size, size);
  const fingerprint = generateFingerprintPattern(canvas, seeds, patternType);

  // Generate base64 image
  fingerprint.imageData = renderToBase64(canvas);

  return fingerprint;
}
