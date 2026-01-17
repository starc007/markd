/**
 * Core utilities for generating visual identity fingerprints
 */

export type PatternType = "mesh" | "voronoi" | "waves" | "sacred" | "particles";

export interface GradientColors {
  colors: string[]; // Array of 2-3 hex colors
}

export interface PatternData {
  type: PatternType;
  seed: number;
  [key: string]: unknown; // Pattern-specific parameters
}

/**
 * Convert hash string to numeric seed values
 * Takes a hex hash string and extracts 8 u32 seed values
 */
export function hashToSeeds(hash: string): number[] {
  const seeds: number[] = [];

  // Parse hex string to bytes
  const bytes: number[] = [];
  for (let i = 0; i < hash.length; i += 2) {
    const byte = parseInt(hash.substr(i, 2), 16);
    bytes.push(isNaN(byte) ? 0 : byte);
  }

  // Extract 8 seeds (4 bytes each = 32 bytes total)
  for (let i = 0; i < 8; i++) {
    const start = i * 4;
    if (start + 4 <= bytes.length) {
      const seed =
        (bytes[start] << 24) |
        (bytes[start + 1] << 16) |
        (bytes[start + 2] << 8) |
        bytes[start + 3];
      seeds.push(seed >>> 0); // Convert to unsigned 32-bit
    } else {
      seeds.push(0);
    }
  }

  return seeds;
}

/**
 * Generate HSL color from seed value
 * Returns hex color string
 */
function seedToHSLColor(seed: number): string {
  // Use seed to generate HSL values
  const h = seed % 360; // Hue: 0-360
  const s = 40 + ((seed >> 8) % 40); // Saturation: 40-80%
  const l = 45 + ((seed >> 16) % 25); // Lightness: 45-70%

  return hslToHex(h, s, l);
}

/**
 * Convert HSL to hex color
 */
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Generate gradient colors from seed values
 * Returns 2-3 colors for the gradient
 */
export function generateGradient(seeds: number[]): GradientColors {
  if (seeds.length < 2) {
    return { colors: ["#6366f1", "#8b5cf6"] }; // Default gradient
  }

  const numColors = 2 + (seeds[0] % 2); // 2 or 3 colors
  const colors: string[] = [];

  for (let i = 0; i < numColors && i < seeds.length; i++) {
    colors.push(seedToHSLColor(seeds[i]));
  }

  return { colors };
}

/**
 * Select pattern type deterministically from seed
 */
export function selectPatternType(seed: number): PatternType {
  const patterns: PatternType[] = [
    "mesh",
    "voronoi",
    "waves",
    "sacred",
    "particles",
  ];
  return patterns[seed % patterns.length];
}

/**
 * Normalize seed value to 0-1 range
 */
export function normalizeSeed(seed: number): number {
  return (seed % 1000000) / 1000000;
}

/**
 * Generate random-like value from seed (deterministic)
 */
export function seededRandom(seed: number): number {
  // Simple LCG-like function for deterministic randomness
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
