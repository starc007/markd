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
export function generateCSSPattern(
  noteId: string,
  title: string,
  content: string,
  width: number,
  height: number
): CSSPatternData {
  const hashInput =
    content && content.trim()
      ? `${title}${content}`
      : `${noteId}${title || "Untitled"}`;

  const seeds = hashToSeeds(hashInput);
  const patternType = selectPatternType(seeds[0]);
  const gradient = generateGradient(seeds);

  const patternParams: Record<string, number> = {
    seed: seeds[0],
    width,
    height,
  };

  let cssStyles: React.CSSProperties = {};
  let cssClasses = "";

  switch (patternType) {
    case "mesh":
      ({ cssStyles, cssClasses } = generateMeshCSS(
        gradient.colors,
        seeds,
        width,
        height
      ));
      break;
    case "voronoi":
      ({ cssStyles, cssClasses } = generateVoronoiCSS(
        gradient.colors,
        seeds,
        width,
        height
      ));
      break;
    case "waves":
      ({ cssStyles, cssClasses } = generateWavesCSS(
        gradient.colors,
        seeds,
        width,
        height
      ));
      break;
    case "sacred":
      ({ cssStyles, cssClasses } = generateSacredCSS(
        gradient.colors,
        seeds,
        width,
        height
      ));
      break;
    case "particles":
      ({ cssStyles, cssClasses } = generateParticlesCSS(
        gradient.colors,
        seeds,
        width,
        height
      ));
      break;
  }

  return {
    gradientColors: gradient.colors,
    patternType,
    cssStyles,
    cssClasses,
    patternParams,
  };
}

/**
 * Generate mesh pattern using CSS - prettier version
 */
function generateMeshCSS(
  colors: string[],
  seeds: number[],
  width: number,
  height: number
): { cssStyles: React.CSSProperties; cssClasses: string } {
  const seed = seeds[0];
  const cellSize = 30 + Math.floor(normalizeSeed(seed) * 50);
  const angle = (normalizeSeed(seed * 2) * 360) % 360;
  const opacity = 0.15 + normalizeSeed(seed * 3) * 0.15;

  // Create beautiful gradient
  const gradient = `linear-gradient(${angle}deg, ${colors.join(", ")})`;

  // Create diagonal mesh lines
  const meshPattern1 = `repeating-linear-gradient(
    ${angle}deg,
    transparent,
    transparent ${cellSize}px,
    rgba(255, 255, 255, ${opacity}) ${cellSize}px,
    rgba(255, 255, 255, ${opacity}) ${cellSize + 1}px,
    transparent ${cellSize + 1}px,
    transparent ${cellSize * 2}px
  )`;

  const meshPattern2 = `repeating-linear-gradient(
    ${angle + 90}deg,
    transparent,
    transparent ${cellSize}px,
    rgba(255, 255, 255, ${opacity * 0.7}) ${cellSize}px,
    rgba(255, 255, 255, ${opacity * 0.7}) ${cellSize + 1}px,
    transparent ${cellSize + 1}px,
    transparent ${cellSize * 2}px
  )`;

  return {
    cssStyles: {
      background: `${gradient}, ${meshPattern1}, ${meshPattern2}`,
      backgroundBlendMode: "overlay, normal",
    },
    cssClasses: "pattern-mesh",
  };
}

/**
 * Generate waves pattern using CSS - prettier version
 */
function generateWavesCSS(
  colors: string[],
  seeds: number[],
  width: number,
  height: number
): { cssStyles: React.CSSProperties; cssClasses: string } {
  const seed = seeds[0];
  const numWaves = 4 + Math.floor(normalizeSeed(seed) * 4);
  const amplitude = 30 + normalizeSeed(seed * 2) * 50;
  const frequency = 0.015 + normalizeSeed(seed * 3) * 0.025;
  const opacity = 0.2 + normalizeSeed(seed * 4) * 0.2;

  // Create beautiful gradient
  const gradient = `radial-gradient(ellipse at center, ${colors[0]} 0%, ${
    colors[1] || colors[0]
  } 100%)`;

  // Create wave pattern using CSS conic-gradient for smoother waves
  const wavePattern = Array.from({ length: numWaves }, (_, i) => {
    const offset = (i / numWaves) * 100;
    const waveGradient = `conic-gradient(
      from ${normalizeSeed(seed + i) * 360}deg at ${offset}% 50%,
      transparent 0deg,
      rgba(255, 255, 255, ${opacity}) ${amplitude}deg,
      transparent ${amplitude * 2}deg
    )`;
    return waveGradient;
  }).join(", ");

  return {
    cssStyles: {
      background: `${gradient}, ${wavePattern}`,
      backgroundBlendMode: "overlay",
      backgroundSize: "100% 100%, 200% 200%",
    },
    cssClasses: "pattern-waves",
  };
}

/**
 * Generate sacred geometry pattern using CSS - prettier version
 */
function generateSacredCSS(
  colors: string[],
  seeds: number[],
  width: number,
  height: number
): { cssStyles: React.CSSProperties; cssClasses: string } {
  const seed = seeds[0];
  const numRings = 4 + Math.floor(normalizeSeed(seed) * 4);
  const numSides = 6 + Math.floor(normalizeSeed(seed * 2) * 8);
  const rotation = (normalizeSeed(seed * 3) * 360) % 360;
  const scale = 0.8 + normalizeSeed(seed * 4) * 0.2;

  // Create beautiful radial gradient
  const gradient = `radial-gradient(circle at 50% 50%, ${colors[0]} 0%, ${
    colors[1] || colors[0]
  } 50%, ${colors[2] || colors[0]} 100%)`;

  // Create concentric circles using multiple radial gradients
  const rings = Array.from({ length: numRings }, (_, i) => {
    const ringProgress = i / numRings;
    const ringSize = 20 + ringProgress * 60;
    const ringOpacity = 0.3 - ringProgress * 0.2;
    return `radial-gradient(circle at 50% 50%, transparent ${ringSize}%, rgba(255, 255, 255, ${ringOpacity}) ${ringSize}%, rgba(255, 255, 255, ${ringOpacity}) ${
      ringSize + 2
    }%, transparent ${ringSize + 2}%)`;
  }).join(", ");

  return {
    cssStyles: {
      background: `${gradient}, ${rings}`,
      backgroundBlendMode: "overlay",
      transform: `rotate(${rotation}deg) scale(${scale})`,
      transformOrigin: "center center",
    },
    cssClasses: "pattern-sacred",
  };
}

/**
 * Generate particles pattern using CSS
 */
function generateParticlesCSS(
  colors: string[],
  seeds: number[],
  width: number,
  height: number
): { cssStyles: React.CSSProperties; cssClasses: string } {
  const seed = seeds[0];
  const numParticles = 20 + Math.floor(normalizeSeed(seed) * 30);
  const particleSize = 2 + normalizeSeed(seed * 2) * 4;

  const gradient = `radial-gradient(circle, ${colors.join(", ")})`;

  // Create particle positions using CSS custom properties
  const particles = Array.from({ length: numParticles }, (_, i) => {
    const x = seededRandom(seed + i * 10) * 100;
    const y = seededRandom(seed + i * 20) * 100;
    const colorIndex = i % colors.length;
    return `${x}% ${y}% ${particleSize}px ${colors[colorIndex]}`;
  }).join(", ");

  return {
    cssStyles: {
      background: gradient,
      backgroundImage: `radial-gradient(circle at var(--particle-x, 50%), var(--particle-y, 50%), rgba(255,255,255,0.3) 1px, transparent 1px)`,
      backgroundSize: `${width / 10}px ${height / 10}px`,
    },
    cssClasses: "pattern-particles",
  };
}

/**
 * Generate Voronoi-like pattern using CSS - prettier version
 */
function generateVoronoiCSS(
  colors: string[],
  seeds: number[],
  width: number,
  height: number
): { cssStyles: React.CSSProperties; cssClasses: string } {
  const seed = seeds[0];
  const numBlobs = 5 + Math.floor(normalizeSeed(seed) * 5);
  const blurAmount = 25 + normalizeSeed(seed * 2) * 35;

  // Create beautiful gradient
  const gradient = `radial-gradient(ellipse at 30% 30%, ${
    colors[0]
  } 0%, transparent 50%), 
                    radial-gradient(ellipse at 70% 70%, ${
                      colors[1] || colors[0]
                    } 0%, transparent 50%),
                    linear-gradient(135deg, ${colors.join(", ")})`;

  // Create multiple blob gradients for depth
  const blobs = Array.from({ length: numBlobs }, (_, i) => {
    const x = seededRandom(seed + i * 10) * 100;
    const y = seededRandom(seed + i * 20) * 100;
    const size = 30 + normalizeSeed(seed + i * 30) * 40;
    const colorIndex = i % colors.length;
    return `radial-gradient(circle at ${x}% ${y}%, ${colors[colorIndex]} 0%, transparent ${size}%)`;
  }).join(", ");

  return {
    cssStyles: {
      background: `${gradient}, ${blobs}`,
      backgroundBlendMode: "overlay, multiply, normal",
      filter: `blur(${blurAmount}px)`,
    },
    cssClasses: "pattern-voronoi",
  };
}
