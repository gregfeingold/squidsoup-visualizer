import * as THREE from 'three';
import { PatternConfig, AudioAnalysis, PatternType } from '../types';
import { wavePattern, linearWave } from './wave';
import { fireworkPattern } from './firework';
import { rainPattern } from './rain';
import { pulsePattern } from './pulse';
import { blobPattern } from './blob';
import { audioSpectrumPattern, verticalWavePattern } from './frequencyZones';
import { starfieldPattern, tetrisPattern, saturnPattern } from './extras';

export type PatternFunction = (
  position: THREE.Vector3,
  time: number,
  config: PatternConfig,
  audio: AudioAnalysis
) => { intensity: number; colorShift: number };

const patternFunctions: Record<PatternType, PatternFunction> = {
  wave: wavePattern,
  firework: fireworkPattern,
  rain: rainPattern,
  pulse: pulsePattern,
  blob: blobPattern,
  custom: linearWave,
  audioSpectrum: audioSpectrumPattern,
  verticalWave: verticalWavePattern,
  starfield: starfieldPattern,
  tetris: tetrisPattern,
  saturn: saturnPattern,
};

export function getPatternFunction(type: PatternType): PatternFunction {
  return patternFunctions[type] || wavePattern;
}

// Reusable result object to avoid allocations
const resultCache = { intensity: 0, colorShift: 0 };

// Neutral audio for non-reactive patterns - constant mid-level values
const neutralAudio: AudioAnalysis = {
  bass: 0.5,
  mid: 0.5,
  treble: 0.5,
  amplitude: 0.5,
  beat: false,
  bpm: 120,
  frequencyData: new Uint8Array(0),
  timestamp: 0,
};

export function evaluatePatterns(
  position: THREE.Vector3,
  time: number,
  patterns: PatternConfig[],
  audio: AudioAnalysis
): { intensity: number; colorShift: number } {
  let totalIntensity = 0;
  let colorAccum = 0;
  let weightSum = 0;

  // Patterns already filtered before calling
  const len = patterns.length;

  for (let i = 0; i < len; i++) {
    const pattern = patterns[i];
    const fn = patternFunctions[pattern.type] || wavePattern;
    // Use neutral audio if pattern is not audio reactive
    const audioToUse = pattern.audioReactive ? audio : neutralAudio;
    const result = fn(position, time, pattern, audioToUse);

    totalIntensity += result.intensity;
    colorAccum += result.colorShift * result.intensity;
    weightSum += result.intensity;
  }

  resultCache.intensity = Math.min(1, totalIntensity);
  resultCache.colorShift = weightSum > 0 ? colorAccum / weightSum : 0;

  return resultCache;
}

export { wavePattern, linearWave } from './wave';
export { fireworkPattern, resetFireworks } from './firework';
export { rainPattern } from './rain';
export { pulsePattern, resetPulse } from './pulse';
export { blobPattern } from './blob';
export { audioSpectrumPattern, verticalWavePattern } from './frequencyZones';
export { starfieldPattern, tetrisPattern, saturnPattern } from './extras';
