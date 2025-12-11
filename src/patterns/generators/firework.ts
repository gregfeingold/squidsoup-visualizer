import * as THREE from 'three';
import { PatternConfig, AudioAnalysis } from '../types';

interface Particle {
  ox: number; oy: number; oz: number; // origin
  vx: number; vy: number; vz: number; // velocity
  startTime: number;
  life: number;
  colorSeed: number;
}

// Global particle system state - limit max particles for performance
const MAX_PARTICLES = 200;
const particles: Particle[] = [];
let lastBeatTime = 0;
let lastAutoTime = 0;

// Firework pattern - explosive bursts that light up 3D space
export function fireworkPattern(
  position: THREE.Vector3,
  time: number,
  config: PatternConfig,
  audio: AudioAnalysis
): { intensity: number; colorShift: number } {
  const { parameters } = config;
  const decay = parameters.decay || 0.5;

  // Spawn new firework on beats OR auto-trigger when no audio
  const shouldTrigger = audio.beat && time - lastBeatTime > 0.25;
  const autoTrigger = audio.amplitude < 0.1 && time - lastAutoTime > 1.2; // Auto-fire every 1.2s when quiet

  if (shouldTrigger || autoTrigger) {
    if (shouldTrigger) lastBeatTime = time;
    if (autoTrigger) lastAutoTime = time;

    // Random burst origin
    const ox = (Math.random() - 0.5) * 10;
    const oy = 2 + Math.random() * 6;
    const oz = (Math.random() - 0.5) * 10;

    // Create particles exploding outward (limit count)
    const particleCount = Math.min(25, 15 + Math.floor(audio.amplitude * 15));

    for (let i = 0; i < particleCount; i++) {
      // Remove old particle if at limit
      if (particles.length >= MAX_PARTICLES) {
        particles.shift();
      }

      // Spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = (1 + Math.random()) * parameters.speed;

      particles.push({
        ox, oy, oz,
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.sin(phi) * Math.sin(theta) * speed,
        vz: Math.cos(phi) * speed,
        startTime: time,
        life: 1.5 + Math.random(),
        colorSeed: Math.random(),
      });
    }
  }

  // Clean old particles (do this sparingly)
  if (particles.length > 0 && Math.random() < 0.1) {
    for (let i = particles.length - 1; i >= 0; i--) {
      if (time - particles[i].startTime > particles[i].life / decay) {
        particles.splice(i, 1);
      }
    }
  }

  // Check proximity to each particle trail
  let intensity = 0;
  let colorAccum = 0;
  let colorWeight = 0;

  const px = position.x;
  const py = position.y;
  const pz = position.z;
  const scaleSq = parameters.scale * parameters.scale;

  for (let i = 0; i < particles.length; i++) {
    const particle = particles[i];
    const age = time - particle.startTime;
    const ageFactor = age * decay / particle.life;

    if (ageFactor >= 1) continue; // Skip dead particles

    // Current particle position (inline calculation)
    const age2 = age * 2;
    const particleX = particle.ox + particle.vx * age2;
    const particleY = particle.oy + particle.vy * age2 - 0.5 * age * age; // gravity
    const particleZ = particle.oz + particle.vz * age2;

    // Distance squared
    const dx = px - particleX;
    const dy = py - particleY;
    const dz = pz - particleZ;
    const distSq = dx * dx + dy * dy + dz * dz;

    // Light radius shrinks as particle ages
    const radius = (1.5 - ageFactor) * parameters.scale;
    const radiusSq = radius * radius;

    if (distSq < radiusSq) {
      const dist = Math.sqrt(distSq);
      const falloff = 1 - dist / radius;
      const fadeOut = 1 - ageFactor;
      const contribution = falloff * falloff * fadeOut * parameters.intensity;

      if (contribution > intensity) {
        intensity = contribution;
        colorAccum = particle.colorSeed;
      }
      colorWeight += contribution;
    }
  }

  return {
    intensity: Math.min(1, intensity),
    colorShift: colorWeight > 0 ? colorAccum : 0
  };
}

export function resetFireworks() {
  particles.length = 0;
  lastBeatTime = 0;
  lastAutoTime = 0;
}
