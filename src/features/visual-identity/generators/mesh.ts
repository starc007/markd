import { normalizeSeed, seededRandom, type PatternData } from "./core";

/**
 * Generate geometric mesh pattern
 */
export function generateMesh(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  patternData: PatternData
): void {
  const seed = patternData.seed;
  const cellSize = 20 + normalizeSeed(seed) * 40; // 20-60px cells
  const lineWidth = 1 + normalizeSeed(seed * 2) * 2; // 1-3px
  const numLayers = 2 + Math.floor(normalizeSeed(seed * 3) * 3); // 2-4 layers

  // Get gradient colors
  const colors = (patternData.colors as string[]) || ["#6366f1", "#8b5cf6"];

  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = colors[0];

  // Draw multiple layers for depth
  for (let layer = 0; layer < numLayers; layer++) {
    const layerOffset = layer * (cellSize / numLayers);
    const layerColor = colors[layer % colors.length];
    ctx.strokeStyle = layerColor;
    ctx.globalAlpha = 0.6 - layer * 0.15;

    // Draw grid lines
    for (let x = -cellSize; x < width + cellSize; x += cellSize) {
      const offset = seededRandom(seed + layer * 100) * 10 - 5;
      ctx.beginPath();
      ctx.moveTo(x + offset, 0);
      ctx.lineTo(x + offset + layerOffset, height);
      ctx.stroke();
    }

    for (let y = -cellSize; y < height + cellSize; y += cellSize) {
      const offset = seededRandom(seed + layer * 200) * 10 - 5;
      ctx.beginPath();
      ctx.moveTo(0, y + offset);
      ctx.lineTo(width, y + offset + layerOffset);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1.0;
}
