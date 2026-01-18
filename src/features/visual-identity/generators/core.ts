/**
 * Core utilities for generating visual identity fingerprints
 */

export type PatternType = "radial-gradient";

export interface GradientColors {
  colors: string[]; // Array of 2-3 hex colors
}

export interface PatternData {
  type: PatternType;
  seed: number;
  [key: string]: unknown; // Pattern-specific parameters
}

/**
 * Hash a string to SHA-256 hex string
 */
async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Convert hash string to numeric seed values
 * Takes a hex hash string and extracts 8 u32 seed values
 */
function hexHashToSeeds(hexHash: string): number[] {
  const seeds: number[] = [];

  // Parse hex string to bytes
  const bytes: number[] = [];
  for (let i = 0; i < hexHash.length; i += 2) {
    const byte = parseInt(hexHash.substr(i, 2), 16);
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
 * Convert any string to numeric seed values by hashing it first
 * This is the main function to use - it hashes the input string to SHA-256,
 * then extracts 8 u32 seed values from the hash
 */
export async function hashToSeeds(input: string): Promise<number[]> {
  // If input is already a hex string (64 chars, only 0-9a-f), use it directly
  // Otherwise, hash it first
  const isHexString = /^[0-9a-f]{64}$/i.test(input);

  if (isHexString) {
    return hexHashToSeeds(input);
  }

  // Hash the input string first
  const hexHash = await hashString(input);
  return hexHashToSeeds(hexHash);
}

/**
 * Generate subtle, light color from seed value
 * Returns hex color string with very light, muted colors like the example
 * Example: muted green/teal fading to light grey/off-white
 */
function seedToHSLColor(seed: number, index: number = 0): string {
  // Use subtle color ranges: muted greens, teals, blues, lavenders, soft pinks
  // Base hue from seed, constrained to soft ranges (120-240 degrees for variety)
  const hueRange = 120; // Start at green
  const hueSpread = 120; // Wider range for more variety (120-240° covers green to blue)
  const baseHue = hueRange + (seed % hueSpread);

  let hue = baseHue;

  if (index === 1) {
    // Second color: very close analogous for subtle transitions
    // Small hue shift for gentle gradient
    const shift = 15 + ((seed >> 8) % 25); // 15-40° shift
    hue = (baseHue + shift) % 360;
  }

  // Low saturation for subtle, muted colors (15-35%)
  const s = 15 + ((seed >> 8) % 20); // Saturation: 15-35%

  // Medium-high lightness for visible but still light feel (60-80%)
  const l = 60 + ((seed >> 16) % 20); // Lightness: 60-80%

  return hslToHex(hue, s, l);
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
 * Returns 2 colors for the gradient with aesthetic color harmony
 * Always returns 2 colors for consistency with the example style
 */
export function generateGradient(seeds: number[]): GradientColors {
  if (seeds.length < 2) {
    return { colors: ["#84d2cc", "#914db3"] }; // Aesthetic default: teal to purple (matching example)
  }

  // Always use 2 colors for aesthetic gradients (like the example)
  const colors: string[] = [];

  // Use first seed for base color, second seed for variation
  colors.push(seedToHSLColor(seeds[0], 0));
  colors.push(seedToHSLColor(seeds[0], 1));

  return { colors };
}

/**
 * Select pattern type deterministically from seed
 */
export function selectPatternType(_seed: number): PatternType {
  // Always use radial-gradient pattern
  return "radial-gradient";
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
