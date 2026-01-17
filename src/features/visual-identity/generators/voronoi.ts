import { normalizeSeed, seededRandom, type PatternData } from "./core";

interface Point {
  x: number;
  y: number;
}

/**
 * Generate Voronoi diagram pattern
 */
export function generateVoronoi(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  patternData: PatternData
): void {
  const seed = patternData.seed;
  const numPoints = 15 + Math.floor(normalizeSeed(seed) * 20); // 15-35 points
  const points: Point[] = [];

  // Generate random points
  for (let i = 0; i < numPoints; i++) {
    const xSeed = seededRandom(seed + i * 100);
    const ySeed = seededRandom(seed + i * 200);
    points.push({
      x: xSeed * width,
      y: ySeed * height,
    });
  }

  // Get gradient colors
  const colors = (patternData.colors as string[]) || ["#6366f1", "#8b5cf6"];

  // Draw Voronoi cells by finding closest point for each pixel
  const cellSize = Math.max(width, height) / 20; // Sample every N pixels for performance
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let y = 0; y < height; y += cellSize) {
    for (let x = 0; x < width; x += cellSize) {
      // Find closest point
      let minDist = Infinity;
      let closestIndex = 0;

      for (let i = 0; i < points.length; i++) {
        const dx = x - points[i].x;
        const dy = y - points[i].y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          closestIndex = i;
        }
      }

      // Color based on closest point
      const colorIndex = closestIndex % colors.length;
      const color = hexToRgb(colors[colorIndex]);
      const alpha = 0.3 + normalizeSeed(seed + closestIndex) * 0.4;

      // Fill cell area
      for (let dy = 0; dy < cellSize && y + dy < height; dy++) {
        for (let dx = 0; dx < cellSize && x + dx < width; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          if (color) {
            data[idx] = color.r;
            data[idx + 1] = color.g;
            data[idx + 2] = color.b;
            data[idx + 3] = Math.floor(alpha * 255);
          }
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Draw point markers
  ctx.fillStyle = colors[0];
  ctx.globalAlpha = 0.8;
  for (const point of points) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}
