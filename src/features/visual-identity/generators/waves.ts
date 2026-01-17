import { normalizeSeed, seededRandom, type PatternData } from "./core";

/**
 * Generate flowing wave pattern
 */
export function generateWaves(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  patternData: PatternData
): void {
  const seed = patternData.seed;
  const numWaves = 3 + Math.floor(normalizeSeed(seed) * 4); // 3-6 waves
  const amplitude = height * (0.1 + normalizeSeed(seed * 2) * 0.2); // 10-30% of height
  const frequency = 0.01 + normalizeSeed(seed * 3) * 0.02; // Wave frequency

  // Get gradient colors
  const colors = (patternData.colors as string[]) || ["#6366f1", "#8b5cf6"];

  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  colors.forEach((color, i) => {
    gradient.addColorStop(i / (colors.length - 1), color);
  });

  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2 + normalizeSeed(seed * 4) * 3; // 2-5px

  // Draw multiple wave layers
  for (let wave = 0; wave < numWaves; wave++) {
    const waveOffset = seededRandom(seed + wave * 100) * Math.PI * 2;
    const waveAmplitude = amplitude * (0.7 + normalizeSeed(seed + wave) * 0.3);
    const waveFreq = frequency * (0.8 + normalizeSeed(seed + wave * 50) * 0.4);
    const yBase = (height / (numWaves + 1)) * (wave + 1);

    ctx.beginPath();
    ctx.moveTo(0, yBase);

    for (let x = 0; x <= width; x += 2) {
      const y =
        yBase +
        Math.sin(x * waveFreq + waveOffset) * waveAmplitude +
        Math.cos(x * waveFreq * 0.7 + waveOffset * 1.3) * (waveAmplitude * 0.5);
      ctx.lineTo(x, y);
    }

    ctx.stroke();

    // Add fill for some waves
    if (normalizeSeed(seed + wave * 200) > 0.5) {
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = colors[wave % colors.length];
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
  }
}
