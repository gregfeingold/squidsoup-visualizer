import * as THREE from 'three';
import { PatternConfig, AudioAnalysis } from '../types';

// Reusable result objects
const starfieldResult = { intensity: 0, colorShift: 0 };
const tetrisResult = { intensity: 0, colorShift: 0 };
const saturnResult = { intensity: 0, colorShift: 0 };

// Starfield - twinkling stars that respond to audio
// Random stars twinkle independently, more stars appear with louder audio
export function starfieldPattern(
  position: THREE.Vector3,
  time: number,
  config: PatternConfig,
  audio: AudioAnalysis
): { intensity: number; colorShift: number } {
  const { parameters } = config;
  const px = position.x;
  const py = position.y;
  const pz = position.z;

  // Create pseudo-random star positions using position as seed
  const starSeed = Math.sin(px * 12.9898 + py * 78.233 + pz * 37.719) * 43758.5453;
  const starId = starSeed - Math.floor(starSeed);

  // Only some points are "stars" (sparse distribution)
  const isStarThreshold = 0.15 + audio.amplitude * 0.2; // More stars when louder
  const isStar = starId < isStarThreshold;

  let intensity = 0;

  if (isStar) {
    // Each star has its own twinkle frequency
    const twinkleSpeed = 2 + starId * 6;
    const twinklePhase = starId * Math.PI * 2;
    const twinkle = Math.sin(time * twinkleSpeed + twinklePhase) * 0.5 + 0.5;

    // Base brightness varies per star
    const baseBrightness = 0.3 + starId * 0.7;

    // Audio reactivity - treble makes stars sparkle brighter
    const audioBoost = 1 + audio.treble * 1.5;

    // Beat makes random stars flash
    let beatFlash = 0;
    if (audio.beat && starId > 0.5) {
      beatFlash = 0.5;
    }

    intensity = (twinkle * baseBrightness * audioBoost + beatFlash) * parameters.intensity;
  }

  // Color varies by star "temperature"
  const colorShift = starId;

  starfieldResult.intensity = Math.min(1, Math.max(0, intensity));
  starfieldResult.colorShift = colorShift;

  return starfieldResult;
}

// Tetris - falling blocks that stack and clear with beats
// Blocks fall from the top and stack at the bottom
interface TetrisBlock {
  x: number;
  z: number;
  y: number;
  color: number;
  speed: number;
  size: number; // Block size multiplier
}
const tetrisBlocks: TetrisBlock[] = [];
let lastTetrisBeat = 0;
let lastTetrisAuto = 0;
let tetrisStackHeight = 0;

export function tetrisPattern(
  position: THREE.Vector3,
  time: number,
  config: PatternConfig,
  audio: AudioAnalysis
): { intensity: number; colorShift: number } {
  const { parameters } = config;
  const px = position.x;
  const py = position.y;
  const pz = position.z;

  // Spawn new blocks on beats OR auto-trigger when no audio
  const shouldTrigger = audio.beat && time - lastTetrisBeat > 0.3;
  const autoTrigger = audio.amplitude < 0.1 && time - lastTetrisAuto > 0.6; // Faster auto-spawn

  if (shouldTrigger || autoTrigger) {
    if (shouldTrigger) lastTetrisBeat = time;
    if (autoTrigger) lastTetrisAuto = time;

    // Create 2-3 falling blocks at once for more visual impact
    const blockCount = shouldTrigger ? 2 + Math.floor(audio.bass * 2) : 2;

    for (let b = 0; b < blockCount; b++) {
      // Create a new falling block at random x,z position
      const blockX = (Math.random() - 0.5) * 16;
      const blockZ = (Math.random() - 0.5) * 16;
      tetrisBlocks.push({
        x: blockX,
        z: blockZ,
        y: 10 + Math.random() * 3, // Stagger start heights
        color: Math.random(),
        speed: shouldTrigger ? 3 + audio.bass * 4 : 2.5, // Decent fall speed
        size: 1.5 + Math.random() * 1, // Larger blocks (1.5-2.5)
      });
    }

    // Limit number of blocks
    while (tetrisBlocks.length > 40) {
      tetrisBlocks.shift();
    }

    // Increase stack on strong beats
    if (audio.bass > 0.6) {
      tetrisStackHeight = Math.min(4, tetrisStackHeight + 0.3);
    }
  }

  // Slowly decrease stack height
  tetrisStackHeight = Math.max(0, tetrisStackHeight - 0.005);

  let intensity = 0;
  let colorShift = 0;

  // Check falling blocks
  for (let i = tetrisBlocks.length - 1; i >= 0; i--) {
    const block = tetrisBlocks[i];

    // Update block position - continuous falling
    block.y -= block.speed * 0.016; // ~60fps

    // Block has landed
    const landingY = -3 + tetrisStackHeight;
    if (block.y < landingY) {
      block.y = landingY;
      block.speed = 0;
    }

    // Check if this position is near the block - LARGER hit area
    const halfSize = block.size;
    const dx = Math.abs(px - block.x);
    const dy = Math.abs(py - block.y);
    const dz = Math.abs(pz - block.z);

    if (dx < halfSize && dy < halfSize && dz < halfSize) {
      // Smooth falloff from center of block
      const distFactor = Math.max(dx, dy, dz) / halfSize;
      const blockIntensity = parameters.intensity * (1 - distFactor * 0.5);
      if (blockIntensity > intensity) {
        intensity = blockIntensity;
        colorShift = block.color;
      }
    }
  }

  // Draw the stack at the bottom - glowing floor
  if (py < -2 + tetrisStackHeight) {
    const stackPattern = Math.sin(px * 0.3 + pz * 0.3 + time * 2) * 0.3 + 0.7;
    const stackIntensity = stackPattern * parameters.intensity * 0.5;
    if (stackIntensity > intensity) {
      intensity = stackIntensity;
      colorShift = (time * 0.15) % 1;
    }
  }

  // Remove old stopped blocks periodically
  if (tetrisBlocks.length > 30) {
    const stoppedBlocks = tetrisBlocks.filter(b => b.speed === 0);
    if (stoppedBlocks.length > 15) {
      const idx = tetrisBlocks.indexOf(stoppedBlocks[0]);
      if (idx >= 0) tetrisBlocks.splice(idx, 1);
    }
  }

  tetrisResult.intensity = Math.min(1, Math.max(0, intensity));
  tetrisResult.colorShift = colorShift;

  return tetrisResult;
}

// Saturn - rotating rings around a glowing center
// The planet pulses with bass, rings rotate with mids
export function saturnPattern(
  position: THREE.Vector3,
  time: number,
  config: PatternConfig,
  audio: AudioAnalysis
): { intensity: number; colorShift: number } {
  const { parameters } = config;

  // Center of the saturn (middle of the grid)
  const centerX = 0;
  const centerY = 6;
  const centerZ = 0;

  const dx = position.x - centerX;
  const dy = position.y - centerY;
  const dz = position.z - centerZ;

  // Distance from center
  const distFromCenter = Math.sqrt(dx * dx + dy * dy + dz * dz);

  // Distance in horizontal plane (for rings)
  const horizontalDist = Math.sqrt(dx * dx + dz * dz);

  let intensity = 0;
  let colorShift = 0;

  // The planet core - glowing sphere that pulses with bass
  const planetRadius = 2 + audio.bass * 1.5;
  if (distFromCenter < planetRadius) {
    const coreGlow = 1 - (distFromCenter / planetRadius) * 0.5;
    intensity = coreGlow * parameters.intensity;
    colorShift = 0.1; // Warm color for core
  }

  // Saturn's rings - tilted and rotating
  const ringTilt = 0.3; // Slight tilt
  const rotationSpeed = 0.5 + audio.mid * 0.5;
  const angle = Math.atan2(dz, dx) + time * rotationSpeed;

  // Adjust y position for tilt
  const tiltedY = dy - Math.sin(angle) * horizontalDist * ringTilt;

  // Ring parameters
  const innerRing = 4;
  const outerRing = 8;
  const ringThickness = 0.8;

  // Check if point is in ring area
  if (horizontalDist > innerRing && horizontalDist < outerRing) {
    // Check if close to ring plane (with tilt)
    if (Math.abs(tiltedY) < ringThickness) {
      // Ring brightness varies with distance from center
      const ringPos = (horizontalDist - innerRing) / (outerRing - innerRing);

      // Create ring bands
      const bandPattern = Math.sin(ringPos * Math.PI * 6) * 0.3 + 0.7;

      // Rings respond to mids
      const ringBrightness = bandPattern * (0.5 + audio.mid * 0.5);

      // Fade at edges of ring thickness
      const edgeFade = 1 - Math.abs(tiltedY) / ringThickness;

      const ringIntensity = ringBrightness * edgeFade * parameters.intensity;

      if (ringIntensity > intensity) {
        intensity = ringIntensity;
        colorShift = 0.5 + ringPos * 0.3; // Blue-purple for rings
      }
    }
  }

  // Add sparkle to rings with treble
  if (horizontalDist > innerRing && horizontalDist < outerRing && audio.treble > 0.3) {
    const sparkle = Math.sin(angle * 8 + time * 10) > 0.8 ? 1 : 0;
    if (sparkle > 0 && Math.abs(tiltedY) < ringThickness) {
      intensity = Math.max(intensity, sparkle * audio.treble * parameters.intensity * 0.5);
    }
  }

  saturnResult.intensity = Math.min(1, Math.max(0, intensity));
  saturnResult.colorShift = colorShift;

  return saturnResult;
}
