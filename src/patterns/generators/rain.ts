import * as THREE from 'three';
import { PatternConfig, AudioAnalysis } from '../types';

// Reusable result object
const result = { intensity: 0, colorShift: 0 };

// Rain pattern - vertical streaks of light with smooth falloff
export function rainPattern(
  position: THREE.Vector3,
  time: number,
  config: PatternConfig,
  audio: AudioAnalysis
): { intensity: number; colorShift: number } {
  const { parameters } = config;

  const speed = parameters.speed * (1 + audio.amplitude * 0.2);
  const px = position.x;
  const py = position.y;
  const pz = position.z;

  // Each vertical column has its own rain timing based on position
  const columnSeed = Math.sin(px * 12.9898 + pz * 78.233) * 43758.5453;
  const columnId = (columnSeed - Math.floor(columnSeed)) * 1000;

  let intensity = 0;

  // Multiple rain drops per column with smooth sine-based movement
  const dropCount = 2;
  for (let d = 0; d < dropCount; d++) {
    const dropPhase = (columnId + d * 333) / 1000;
    const dropSpeed = speed * (0.8 + (columnId % 100) / 200);

    // Smooth sine-based drop position
    const cycleLength = 10 / dropSpeed;
    const dropProgress = ((time * dropSpeed + dropPhase * cycleLength) % cycleLength) / cycleLength;

    // Drop falls from top, with smooth easing
    const easeProgress = dropProgress * dropProgress * (3 - 2 * dropProgress); // smoothstep
    const dropY = 12 - easeProgress * 14;

    // Drop length with smooth falloff
    const dropLength = 2.0 * parameters.scale;
    const distFromDrop = py - dropY;

    // Smooth intensity falloff using cosine
    if (distFromDrop > -dropLength * 0.3 && distFromDrop < dropLength) {
      const normalizedDist = (distFromDrop + dropLength * 0.3) / (dropLength * 1.3);
      // Bright at the leading edge, fading trail behind
      const dropIntensity = Math.cos(normalizedDist * Math.PI * 0.5) * parameters.intensity;

      // Audio reactive - bass makes drops brighter
      const audioBoost = 0.6 + audio.bass * 0.6;

      const contribution = dropIntensity * audioBoost * (1 - d * 0.3);
      if (contribution > intensity) {
        intensity = contribution;
      }
    }
  }

  // Ground splash effect - smooth ripple when bass hits
  if (py < 2 && audio.bass > 0.3) {
    const groundFade = 1 - py / 2;
    const splashWave = Math.sin(time * 8 + columnId * 0.01) * 0.5 + 0.5;
    const splash = groundFade * splashWave * audio.bass * 0.4 * parameters.intensity;
    intensity = Math.max(intensity, splash);
  }

  // Ambient rain shimmer throughout
  const shimmer = Math.sin(px * 2 + py * 3 + pz * 2 + time * 5) * 0.5 + 0.5;
  const ambientRain = shimmer * audio.amplitude * 0.15 * parameters.intensity;
  intensity = Math.max(intensity, ambientRain);

  result.intensity = Math.min(1, Math.max(0, intensity));
  result.colorShift = ((columnId / 1000) + time * 0.08) % 1;

  return result;
}
