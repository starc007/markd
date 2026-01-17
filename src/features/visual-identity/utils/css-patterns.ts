/**
 * CSS-based pattern generation - no canvas, no Base64 storage
 * Generates beautiful patterns using pure CSS
 */

import {
  generateGradient,
  hashToSeeds,
  selectPatternType,
  normalizeSeed,
  seededRandom,
  type PatternType,
} from "../generators/core";

export interface CSSPatternData {
  gradientColors: string[];
  patternType: PatternType;
  cssStyles: React.CSSProperties;
  cssClasses: string;
  patternParams: Record<string, number>;
}

/**
 * Generate CSS-based fingerprint pattern
 */
export async function generateCSSPattern(
  noteId: string,
  title: string,
  content: string,
  width: number,
  height: number
): Promise<CSSPatternData> {
  // If title is empty and content looks like a full hash (contains "__REGEN__" or "__" separators or is very long),
  // treat content as the complete hash input (already includes title)
  // This happens when using a regenerated fingerprint hash
  let hashInput: string;
  if (
    !title &&
    content &&
    (content.includes("__REGEN__") ||
      content.includes("__") ||
      content.length > 50)
  ) {
    // This is a regenerated hash that already includes title + content + timestamp
    hashInput = content;
  } else {
    // Normal generation: construct hash from title + content
    hashInput =
      content && content.trim()
        ? `${title}${content}`
        : `${noteId}${title || "Untitled"}`;
  }

  const seeds = await hashToSeeds(hashInput);
  const patternType = selectPatternType(seeds[0]);
  const gradient = generateGradient(seeds);

  const patternParams: Record<string, number> = {
    seed: seeds[0],
    width,
    height,
  };

  // Always use voronoi pattern for subtle radial gradients
  const { cssStyles, cssClasses } = generateVoronoiCSS(
    gradient.colors,
    seeds,
    width,
    height
  );

  return {
    gradientColors: gradient.colors,
    patternType,
    cssStyles,
    cssClasses,
    patternParams,
  };
}

/**
 * Generate subtle radial gradient pattern - light and minimal like the example
 * Soft radial gradient from center fading to edges
 */
function generateVoronoiCSS(
  colors: string[],
  seeds: number[],
  _width: number,
  _height: number
): { cssStyles: React.CSSProperties; cssClasses: string } {
  const seed = seeds[0];

  // Convert hex colors to rgb
  const color1 = hexToRgb(colors[0]);
  const color2 = colors[1] ? hexToRgb(colors[1]) : color1;

  // Center position - varied based on seed for different looks
  const centerX = 35 + normalizeSeed(seed) * 30; // 35-65% - more variation
  const centerY = 35 + normalizeSeed(seed * 2) * 30; // 35-65% - more variation

  // Gradient stops - vary the fade points for different looks
  const stop1 = normalizeSeed(seed * 3) * 20; // 0-20%
  const stop2 = 35 + normalizeSeed(seed * 4) * 20; // 35-55%
  const stop3 = 70 + normalizeSeed(seed * 5) * 20; // 70-90%

  // Create soft radial gradient from center with varied stops
  const gradient = `radial-gradient(circle at ${centerX}% ${centerY}%, ${color1} ${stop1}%, ${color2} ${stop2}%, rgba(250, 250, 250, 0.98) ${stop3}%, rgba(255, 255, 255, 1) 100%)`;

  // Add subtle blur for softness - vary the amount
  const blurAmount = 15 + normalizeSeed(seed * 6) * 20; // 15-35px blur

  return {
    cssStyles: {
      background: gradient,
      filter: `blur(${blurAmount}px)`,
    },
    cssClasses: "pattern-voronoi",
  };
}

/**
 * Convert hex color to rgb() format for CSS
 */
function hexToRgb(hex: string): string {
  // Remove # if present
  const cleanHex = hex.replace("#", "");

  // Parse hex to RGB
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `rgb(${r}, ${g}, ${b})`;
}
