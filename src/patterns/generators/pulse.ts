import * as THREE from 'three';
import { PatternConfig, AudioAnalysis } from '../types';

// Track beat events for pulse timing - use simple arrays instead of objects
const MAX_PULSES = 10;
const pulseTimes: number[] = [];
const pulseOriginX: number[] = [];
const pulseOriginY: number[] = [];
const pulseOriginZ: number[] = [];
let lastBeatTime = 0;
let lastAutoTime = 0;

// Reusable result object
const result = { intensity: 0, colorShift: 0 };

// Pulse pattern - expanding spherical shells of light triggered by beats
export function pulsePattern(
  position: THREE.Vector3,
  time: number,
  config: PatternConfig,
  audio: AudioAnalysis
): { intensity: number; colorShift: number } {
  const { parameters } = config;
  const originX = parameters.origin.x;
  const originY = parameters.origin.y;
  const originZ = parameters.origin.z;

  // Trigger new pulse on beat (with cooldown) OR auto-trigger if no audio
  const shouldTrigger = audio.beat && time - lastBeatTime > 0.25;
  const autoTrigger = audio.amplitude < 0.1 && time - lastAutoTime > 1.0; // Auto pulse every 1s when no audio

  if (shouldTrigger || autoTrigger) {
    if (shouldTrigger) lastBeatTime = time;
    if (autoTrigger) lastAutoTime = time;

    // Add new pulse, removing oldest if at limit
    if (pulseTimes.length >= MAX_PULSES) {
      pulseTimes.shift();
      pulseOriginX.shift();
      pulseOriginY.shift();
      pulseOriginZ.shift();
    }

    pulseTimes.push(time);
    pulseOriginX.push(originX + (Math.random() - 0.5) * 4);
    pulseOriginY.push(originY + (Math.random() - 0.5) * 4);
    pulseOriginZ.push(originZ + (Math.random() - 0.5) * 4);
  }

  const decay = parameters.decay || 0.5;
  const maxPulseLife = 4 / decay;

  let intensity = 0;
  let colorAccum = 0;

  const px = position.x;
  const py = position.y;
  const pz = position.z;

  // Evaluate each active pulse
  for (let i = pulseTimes.length - 1; i >= 0; i--) {
    const pulseTime = pulseTimes[i];
    const age = time - pulseTime;

    // Remove old pulses
    if (age > maxPulseLife) {
      pulseTimes.splice(i, 1);
      pulseOriginX.splice(i, 1);
      pulseOriginY.splice(i, 1);
      pulseOriginZ.splice(i, 1);
      continue;
    }

    // Expanding shell radius
    const shellRadius = age * parameters.speed * 5;
    const shellThickness = 2.0 * parameters.scale;

    // Distance from this point to pulse origin
    const dx = px - pulseOriginX[i];
    const dy = py - pulseOriginY[i];
    const dz = pz - pulseOriginZ[i];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Check if point is within the expanding shell
    const distFromShell = Math.abs(distance - shellRadius);

    if (distFromShell < shellThickness) {
      // Smooth falloff at edges and over time
      const shellFalloff = 1 - distFromShell / shellThickness;
      const timeFalloff = Math.exp(-age * decay);
      const contribution = shellFalloff * shellFalloff * timeFalloff * parameters.intensity;

      if (contribution > intensity) {
        intensity = contribution;
        colorAccum = (i / MAX_PULSES) + age * 0.2;
      }
    }
  }

  result.intensity = Math.min(1, intensity);
  result.colorShift = colorAccum % 1;

  return result;
}

export function resetPulse() {
  pulseTimes.length = 0;
  pulseOriginX.length = 0;
  pulseOriginY.length = 0;
  pulseOriginZ.length = 0;
  lastBeatTime = 0;
}
