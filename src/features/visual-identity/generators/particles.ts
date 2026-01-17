import { normalizeSeed, seededRandom, type PatternData } from "./core";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  colorIndex: number;
}

/**
 * Generate dynamic particle system pattern
 */
export function generateParticles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  patternData: PatternData
): void {
  const seed = patternData.seed;
  const numParticles = 20 + Math.floor(normalizeSeed(seed) * 30); // 20-50 particles
  const particles: Particle[] = [];

  // Get gradient colors
  const colors = (patternData.colors as string[]) || ["#6366f1", "#8b5cf6"];

  // Initialize particles
  for (let i = 0; i < numParticles; i++) {
    const xSeed = seededRandom(seed + i * 100);
    const ySeed = seededRandom(seed + i * 200);
    const vxSeed = seededRandom(seed + i * 300);
    const vySeed = seededRandom(seed + i * 400);

    particles.push({
      x: xSeed * width,
      y: ySeed * height,
      vx: (vxSeed - 0.5) * 2,
      vy: (vySeed - 0.5) * 2,
      size: 2 + normalizeSeed(seed + i * 50) * 4, // 2-6px
      colorIndex: i % colors.length,
    });
  }

  // Draw particles and connections
  const connectionDistance = Math.min(width, height) * 0.15;

  for (let i = 0; i < particles.length; i++) {
    const p1 = particles[i];

    // Draw particle
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2);
    ctx.fillStyle = colors[p1.colorIndex];
    ctx.globalAlpha = 0.8;
    ctx.fill();

    // Draw connections to nearby particles
    for (let j = i + 1; j < particles.length; j++) {
      const p2 = particles[j];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < connectionDistance) {
        const opacity = 1 - dist / connectionDistance;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = colors[p1.colorIndex];
        ctx.globalAlpha = opacity * 0.3;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  // Draw particle trails (optional, for more dynamic look)
  if (normalizeSeed(seed * 5) > 0.5) {
    for (const particle of particles) {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
      ctx.fillStyle = colors[particle.colorIndex];
      ctx.globalAlpha = 0.1;
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1.0;
}
