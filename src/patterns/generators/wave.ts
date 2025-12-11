import * as THREE from 'three';
import { PatternConfig, AudioAnalysis } from '../types';

// Reusable result objects
const waveResult = { intensity: 0, colorShift: 0 };
const linearResult = { intensity: 0, colorShift: 0 };

// Radial wave - smooth expanding rings with sine falloff
export function wavePattern(
  position: THREE.Vector3,
  time: number,
  config: PatternConfig,
  audio: AudioAnalysis
): { intensity: number; colorShift: number } {
  const { parameters } = config;
  const ox = parameters.origin.x;
  const oy = parameters.origin.y;
  const oz = parameters.origin.z;

  // Calculate distance without creating Vector3
  const dx = position.x - ox;
  const dy = position.y - oy;
  const dz = position.z - oz;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  const speed = parameters.speed * (1 + audio.amplitude * 0.3);
  const frequency = parameters.frequency || 1;

  // Create smooth sine wave pattern instead of hard-edged rings
  const wavePhase = distance * frequency * 0.5 - time * speed * 2;
  const wave1 = Math.sin(wavePhase) * 0.5 + 0.5;

  // Second wave at different frequency for complexity
  const wave2 = Math.sin(wavePhase * 1.7 + 1) * 0.5 + 0.5;

  // Combine waves with distance falloff
  const distanceFalloff = Math.max(0, 1 - distance / 15);
  let intensity = (wave1 * 0.7 + wave2 * 0.3) * distanceFalloff * parameters.intensity;

  // Audio reactivity - bass amplifies the wave peaks
  intensity *= 0.5 + audio.bass * 0.8;

  // Beat adds a pulse from center
  if (audio.beat) {
    const beatPulse = Math.max(0, 1 - distance / 8) * 0.4;
    intensity = Math.max(intensity, beatPulse);
  }

  // Treble adds sparkle at the peaks
  if (wave1 > 0.7) {
    intensity += audio.treble * 0.2 * (wave1 - 0.7) / 0.3;
  }

  waveResult.intensity = Math.min(1, Math.max(0, intensity));
  waveResult.colorShift = (distance * 0.05 + time * 0.15) % 1;

  return waveResult;
}

// Linear wave - a smooth plane of light sweeping through space
export function linearWave(
  position: THREE.Vector3,
  time: number,
  config: PatternConfig,
  audio: AudioAnalysis
): { intensity: number; colorShift: number } {
  const { parameters } = config;
  const dirX = parameters.direction.x;
  const dirY = parameters.direction.y;
  const dirZ = parameters.direction.z;

  // Normalize direction inline
  const dirLen = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 1;
  const ndx = dirX / dirLen;
  const ndy = dirY / dirLen;
  const ndz = dirZ / dirLen;

  const speed = parameters.speed * (1 + audio.mid * 0.2);

  // Project position onto direction
  const projection = position.x * ndx + position.y * ndy + position.z * ndz;

  // Smooth sine wave along the direction
  const wavePhase = projection * 0.3 - time * speed * 3;
  const wave1 = Math.sin(wavePhase) * 0.5 + 0.5;
  const wave2 = Math.sin(wavePhase * 0.6 + 2) * 0.5 + 0.5;

  let intensity = (wave1 * 0.6 + wave2 * 0.4) * parameters.intensity;

  // Audio modulation
  intensity *= 0.4 + audio.amplitude * 0.8;

  // Height-based variation
  const heightMod = Math.sin(position.y * 0.5 + time) * 0.15 + 0.85;
  intensity *= heightMod;

  linearResult.intensity = Math.min(1, Math.max(0, intensity));
  linearResult.colorShift = (projection * 0.08 + time * 0.12) % 1;

  return linearResult;
}
