import * as THREE from 'three';
import { PatternConfig, AudioAnalysis } from '../types';

// Reusable result object
const result = { intensity: 0, colorShift: 0 };

// Audio Spectrum Visualizer - clear frequency band separation
// Bass = bottom, Mids = middle, Treble = top
// Uses max 50% of lights to leave room for other patterns
export function audioSpectrumPattern(
  position: THREE.Vector3,
  time: number,
  config: PatternConfig,
  audio: AudioAnalysis
): { intensity: number; colorShift: number } {
  const { parameters } = config;

  // Normalize height to 0-1 range
  const normalizedY = Math.max(0, Math.min(1, (position.y - 1) / 11));
  const px = position.x;
  const pz = position.z;

  // Create clear horizontal bands that rise with audio levels
  // Each band shows a "bar" that fills up based on that frequency

  let intensity = 0;
  let colorShift = 0;

  // BASS ZONE (bottom 0-33%) - rises from floor based on bass level
  if (normalizedY < 0.33) {
    const bassLevel = audio.bass; // 0-1
    const bassHeight = bassLevel * 0.33; // How high the bass "bar" extends

    if (normalizedY < bassHeight) {
      // Inside the bass bar - bright
      const fillAmount = 1 - (normalizedY / bassHeight) * 0.3; // Slight gradient
      // Add horizontal wave for movement
      const wave = Math.sin(px * 0.4 + time * 2) * 0.1 + 0.9;
      intensity = fillAmount * wave * parameters.intensity;
      colorShift = 0.0; // Red/warm colors for bass
    }
  }

  // MID ZONE (middle 33-66%) - rises based on mid level
  if (normalizedY >= 0.28 && normalizedY < 0.66) {
    const midLevel = audio.mid;
    const zoneStart = 0.33;
    const zoneHeight = 0.33;
    const midHeight = zoneStart + midLevel * zoneHeight;

    if (normalizedY < midHeight && normalizedY >= zoneStart) {
      const localY = (normalizedY - zoneStart) / (midHeight - zoneStart + 0.01);
      const fillAmount = 1 - localY * 0.3;
      const wave = Math.sin(pz * 0.5 + time * 3) * 0.1 + 0.9;
      const midIntensity = fillAmount * wave * parameters.intensity;
      if (midIntensity > intensity) {
        intensity = midIntensity;
        colorShift = 0.33; // Green/cyan for mids
      }
    }
  }

  // TREBLE ZONE (top 66-100%) - rises based on treble level
  if (normalizedY >= 0.60) {
    const trebleLevel = audio.treble;
    const zoneStart = 0.66;
    const zoneHeight = 0.34;
    const trebleHeight = zoneStart + trebleLevel * zoneHeight;

    if (normalizedY < trebleHeight && normalizedY >= zoneStart) {
      const localY = (normalizedY - zoneStart) / (trebleHeight - zoneStart + 0.01);
      const fillAmount = 1 - localY * 0.3;
      // Faster sparkle for treble
      const sparkle = Math.sin(px * 2 + pz * 2 + time * 6) * 0.15 + 0.85;
      const trebleIntensity = fillAmount * sparkle * parameters.intensity;
      if (trebleIntensity > intensity) {
        intensity = trebleIntensity;
        colorShift = 0.66; // Blue/purple for treble
      }
    }
  }

  // Beat pulse - flash across all zones on beat
  if (audio.beat) {
    intensity = Math.max(intensity, 0.4 * parameters.intensity);
  }

  // Limit to 50% of max to leave room for other patterns
  intensity = Math.min(0.5, intensity);

  result.intensity = Math.max(0, intensity);
  result.colorShift = colorShift;

  return result;
}

// Legacy alias for backwards compatibility
export const frequencyZonesPattern = audioSpectrumPattern;

// Vertical wave pattern - waves that rise and fall with the music
export function verticalWavePattern(
  position: THREE.Vector3,
  time: number,
  config: PatternConfig,
  audio: AudioAnalysis
): { intensity: number; colorShift: number } {
  const { parameters } = config;

  const normalizedY = Math.max(0, Math.min(1, (position.y - 1) / 11));
  const px = position.x;
  const pz = position.z;

  // Create multiple wave layers for more organic feel
  // Each wave has different phase based on horizontal position
  const wavePhase1 = Math.sin(px * 0.3 + time * 0.5) * 0.15;
  const wavePhase2 = Math.sin(pz * 0.3 + time * 0.4) * 0.1;
  const wavePhase3 = Math.sin((px + pz) * 0.2 + time * 0.3) * 0.1;

  // Base wave height driven by bass - slow, powerful movements
  const bassWaveHeight = audio.bass * 0.5;

  // Mid frequencies add faster ripples
  const midWaveHeight = audio.mid * 0.3;

  // Combined wave height with spatial variation
  const totalWaveHeight = bassWaveHeight + midWaveHeight + wavePhase1 + wavePhase2 + wavePhase3;

  // The "water level" that rises and falls
  const waterLevel = Math.max(0, Math.min(0.9, totalWaveHeight));

  let intensity = 0;

  // Points below water level are lit
  if (normalizedY < waterLevel) {
    // Gradient: brighter near the surface, dimmer at the bottom
    const depthFromSurface = waterLevel - normalizedY;
    const surfaceGlow = Math.max(0, 1 - depthFromSurface * 3); // Bright near surface
    const depthGlow = normalizedY * 0.5; // Some glow at depth

    intensity = (surfaceGlow * 0.7 + depthGlow * 0.3) * parameters.intensity;
  }

  // At the wave crest - brightest with smooth falloff
  const distFromSurface = Math.abs(normalizedY - waterLevel);
  if (distFromSurface < 0.12) {
    const crestGlow = smoothstep(0.12, 0, distFromSurface);
    const crestIntensity = crestGlow * parameters.intensity * (0.8 + audio.amplitude * 0.4);
    intensity = Math.max(intensity, crestIntensity);
  }

  // Treble creates spray/sparkle above the wave
  if (normalizedY > waterLevel && normalizedY < waterLevel + 0.25) {
    const sprayHeight = (normalizedY - waterLevel) / 0.25;
    const sparklePhase = Math.sin(px * 5 + pz * 5 + time * 12);
    const sparkle = sparklePhase > 0.5 ? (sparklePhase - 0.5) * 2 : 0;
    const sprayIntensity = sparkle * audio.treble * (1 - sprayHeight) * 0.6;
    intensity = Math.max(intensity, sprayIntensity * parameters.intensity);
  }

  // Add subtle ambient pulse with beats
  if (audio.beat && normalizedY < 0.3) {
    const beatPulse = (0.3 - normalizedY) / 0.3 * 0.3;
    intensity = Math.max(intensity, beatPulse * parameters.intensity);
  }

  // Color shifts from bottom to top
  const colorShift = (normalizedY * 0.6 + waterLevel * 0.3 + time * 0.08) % 1;

  result.intensity = Math.min(1, Math.max(0, intensity));
  result.colorShift = colorShift;

  return result;
}

// Smoothstep helper function
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
