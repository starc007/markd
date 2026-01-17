import { normalizeSeed, seededRandom, type PatternData } from "./core";

/**
 * Generate sacred geometry / mandala pattern
 */
export function generateSacred(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  patternData: PatternData
): void {
  const seed = patternData.seed;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2;
  const numRings = 3 + Math.floor(normalizeSeed(seed) * 4); // 3-6 rings
  const numSides = 6 + Math.floor(normalizeSeed(seed * 2) * 6); // 6-11 sides

  // Get gradient colors
  const colors = (patternData.colors as string[]) || ["#6366f1", "#8b5cf6"];

  ctx.save();
  ctx.translate(centerX, centerY);

  // Draw concentric rings with polygons
  for (let ring = 0; ring < numRings; ring++) {
    const ringProgress = ring / numRings;
    const radius = maxRadius * (0.2 + ringProgress * 0.7);
    const rotation = seededRandom(seed + ring * 50) * Math.PI * 2;
    const colorIndex = ring % colors.length;

    ctx.strokeStyle = colors[colorIndex];
    ctx.fillStyle = colors[colorIndex];
    ctx.lineWidth = 1 + normalizeSeed(seed + ring) * 2;
    ctx.globalAlpha = 0.6 - ringProgress * 0.3;

    // Draw polygon
    ctx.beginPath();
    for (let i = 0; i <= numSides; i++) {
      const angle = (Math.PI * 2 * i) / numSides + rotation;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();

    // Fill some rings
    if (normalizeSeed(seed + ring * 100) > 0.6) {
      ctx.globalAlpha = 0.1;
      ctx.fill();
      ctx.globalAlpha = 0.6 - ringProgress * 0.3;
    }

    // Draw connecting lines
    if (ring > 0 && normalizeSeed(seed + ring * 150) > 0.4) {
      const prevRadius = maxRadius * (0.2 + ((ring - 1) / numRings) * 0.7);
      for (let i = 0; i < numSides; i++) {
        const angle = (Math.PI * 2 * i) / numSides + rotation;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * prevRadius, Math.sin(angle) * prevRadius);
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        ctx.stroke();
      }
    }
  }

  // Draw center circle
  ctx.beginPath();
  ctx.arc(0, 0, maxRadius * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = colors[0];
  ctx.globalAlpha = 0.8;
  ctx.fill();

  ctx.restore();
  ctx.globalAlpha = 1.0;
}
