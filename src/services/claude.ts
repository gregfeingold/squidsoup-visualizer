import Anthropic from '@anthropic-ai/sdk';
import { PatternType } from '../patterns/types';

interface GeneratedPattern {
  type: PatternType;
  name: string;
  parameters: {
    speed: number;
    scale: number;
    intensity: number;
    frequency?: number;
    decay?: number;
    spread?: number;
    direction?: [number, number, number];
    origin?: [number, number, number];
  };
  audioMappings: Array<{
    feature: 'bass' | 'mid' | 'treble' | 'amplitude' | 'beat';
    parameter: string;
    intensity: number;
  }>;
  colorBehavior: {
    mode: 'static' | 'cycle' | 'reactive';
    cycleSpeed?: number;
    reactTo?: 'bass' | 'mid' | 'treble' | 'amplitude' | 'beat';
  };
}

const SYSTEM_PROMPT = `You are a concert lighting designer for a 3D point-cloud LED installation similar to Squidsoup's "Submergence" - 40,000 individual LEDs suspended on vertical strings throughout a concert venue.

CRITICAL: The lights are OFF by default. Patterns must describe which specific 3D volumes/shapes should be LIT UP. Think of it like sculpting with light in 3D space - you're defining WHERE light appears, not global brightness.

Pattern types and what they illuminate:
- wave: Expanding rings or planes of light that sweep through space (like a radar ping)
- firework: Explosive bursts - particles fly outward from a point, each lighting nearby LEDs
- rain: Vertical streaks falling downward - only lights along the falling paths are on
- pulse: Expanding spherical SHELLS (hollow spheres) triggered by beats
- blob: Floating 3D orbs/spheres that drift through the space, only lights INSIDE the orb are on

Key concepts:
- scale: Controls SIZE of the lit shapes (larger = bigger glowing regions)
- speed: How fast shapes move/expand
- intensity: Brightness of lit regions (0.6-1.0 for visible, lower for subtle)
- origin: Center point [x, y, z] where patterns emanate from (y=5 is roughly center height)

Respond ONLY with valid JSON:
{
  "type": "wave|firework|rain|pulse|blob",
  "name": "Short descriptive name",
  "parameters": {
    "speed": 0.5-2.0,
    "scale": 0.5-2.0,
    "intensity": 0.6-1.0,
    "frequency": 0.5-3.0,
    "decay": 0.3-1.0,
    "spread": 0.5-2.0,
    "direction": [x, y, z],
    "origin": [x, y, z]
  },
  "audioMappings": [
    {"feature": "bass|mid|treble|amplitude|beat", "parameter": "speed|scale|intensity", "intensity": 0.3-1.0}
  ],
  "colorBehavior": {
    "mode": "static|cycle|reactive",
    "cycleSpeed": 0.5-2.0,
    "reactTo": "bass|mid|treble|amplitude"
  }
}`;

export async function generatePatternFromDescription(
  description: string,
  apiKey: string
): Promise<GeneratedPattern> {
  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Create a 3D light pattern for: "${description}"`,
      },
    ],
  });

  const textContent = message.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not find JSON in response');
  }

  const pattern = JSON.parse(jsonMatch[0]) as GeneratedPattern;

  return {
    type: pattern.type || 'wave',
    name: pattern.name || description.slice(0, 30),
    parameters: {
      speed: clamp(pattern.parameters?.speed ?? 1, 0.1, 3),
      scale: clamp(pattern.parameters?.scale ?? 1, 0.1, 3),
      intensity: clamp(pattern.parameters?.intensity ?? 0.8, 0.1, 1),
      frequency: clamp(pattern.parameters?.frequency ?? 1, 0.1, 5),
      decay: clamp(pattern.parameters?.decay ?? 0.5, 0.1, 2),
      spread: clamp(pattern.parameters?.spread ?? 1, 0.1, 3),
      direction: pattern.parameters?.direction || [0, 1, 0],
      origin: pattern.parameters?.origin || [0, 5, 0],
    },
    audioMappings: pattern.audioMappings || [
      { feature: 'bass', parameter: 'intensity', intensity: 0.7 },
    ],
    colorBehavior: pattern.colorBehavior || {
      mode: 'reactive',
      reactTo: 'amplitude',
    },
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Pattern descriptions for UI display
export const PATTERN_INFO: Record<string, { name: string; description: string }> = {
  audioSpectrum: { name: 'Audio Spectrum', description: 'Bass/mid/treble as rising horizontal bars' },
  wave: { name: 'Expanding Sphere', description: 'Concentric spheres expanding from center' },
  firework: { name: 'Burst Particles', description: 'Explosive particle bursts on beats' },
  rain: { name: 'Falling Streaks', description: 'Vertical light trails falling downward' },
  pulse: { name: 'Beat Shells', description: 'Expanding hollow spheres on each beat' },
  blob: { name: 'Drifting Orbs', description: 'Floating glowing spheres that drift around' },
  verticalWave: { name: 'Rising Tide', description: 'Wave that rises and falls with bass' },
  starfield: { name: 'Starfield', description: 'Twinkling stars that sparkle with treble' },
  tetris: { name: 'Tetris Blocks', description: 'Falling blocks that stack on beats' },
  saturn: { name: 'Saturn', description: 'Glowing planet with rotating rings' },
};

// Demo patterns with proper 3D volumetric behavior
export const DEMO_PATTERNS: Record<string, GeneratedPattern> = {
  // Drifting Orbs - floating spheres
  'drifting orbs': {
    type: 'blob',
    name: 'Drifting Orbs',
    parameters: {
      speed: 0.6,
      scale: 1.2,
      intensity: 0.85,
      spread: 1.5,
      origin: [0, 5, 0],
    },
    audioMappings: [
      { feature: 'amplitude', parameter: 'scale', intensity: 0.7 },
      { feature: 'mid', parameter: 'speed', intensity: 0.4 },
    ],
    colorBehavior: {
      mode: 'cycle',
      cycleSpeed: 0.2,
    },
  },
  // Expanding Sphere - concentric rings/spheres
  'expanding sphere': {
    type: 'wave',
    name: 'Expanding Sphere',
    parameters: {
      speed: 1.2,
      scale: 1.0,
      intensity: 0.85,
      frequency: 1.5,
      origin: [0, 5, 0],
    },
    audioMappings: [
      { feature: 'bass', parameter: 'intensity', intensity: 0.8 },
      { feature: 'beat', parameter: 'speed', intensity: 0.5 },
    ],
    colorBehavior: {
      mode: 'reactive',
      reactTo: 'amplitude',
    },
  },
  // Burst Particles - firework explosions
  'burst particles': {
    type: 'firework',
    name: 'Burst Particles',
    parameters: {
      speed: 1.3,
      scale: 1.0,
      intensity: 0.9,
      decay: 0.5,
      spread: 1.2,
      origin: [0, 6, 0],
    },
    audioMappings: [
      { feature: 'beat', parameter: 'intensity', intensity: 1.0 },
      { feature: 'bass', parameter: 'scale', intensity: 0.5 },
    ],
    colorBehavior: {
      mode: 'reactive',
      reactTo: 'beat',
    },
  },
  // Falling Streaks - rain
  'falling streaks': {
    type: 'rain',
    name: 'Falling Streaks',
    parameters: {
      speed: 1.2,
      scale: 0.9,
      intensity: 0.8,
      spread: 1.2,
      direction: [0, -1, 0],
      origin: [0, 10, 0],
    },
    audioMappings: [
      { feature: 'mid', parameter: 'speed', intensity: 0.5 },
      { feature: 'bass', parameter: 'intensity', intensity: 0.4 },
    ],
    colorBehavior: {
      mode: 'cycle',
      cycleSpeed: 0.5,
    },
  },
  // Beat Shells - pulsing spheres
  'beat shells': {
    type: 'pulse',
    name: 'Beat Shells',
    parameters: {
      speed: 1.5,
      scale: 1.0,
      intensity: 0.9,
      decay: 0.6,
      origin: [0, 4, 0],
    },
    audioMappings: [
      { feature: 'beat', parameter: 'intensity', intensity: 1.0 },
      { feature: 'bass', parameter: 'scale', intensity: 0.8 },
    ],
    colorBehavior: {
      mode: 'reactive',
      reactTo: 'beat',
    },
  },
  // Rising Tide - vertical wave
  'rising tide': {
    type: 'verticalWave',
    name: 'Rising Tide',
    parameters: {
      speed: 1.0,
      scale: 1.0,
      intensity: 0.85,
      origin: [0, 0, 0],
    },
    audioMappings: [
      { feature: 'bass', parameter: 'intensity', intensity: 0.9 },
      { feature: 'amplitude', parameter: 'scale', intensity: 0.6 },
    ],
    colorBehavior: {
      mode: 'reactive',
      reactTo: 'bass',
    },
  },
  // Starfield - twinkling stars
  'starfield': {
    type: 'starfield',
    name: 'Starfield',
    parameters: {
      speed: 1.0,
      scale: 1.0,
      intensity: 0.9,
      origin: [0, 5, 0],
    },
    audioMappings: [
      { feature: 'treble', parameter: 'intensity', intensity: 0.8 },
      { feature: 'amplitude', parameter: 'scale', intensity: 0.5 },
    ],
    colorBehavior: {
      mode: 'cycle',
      cycleSpeed: 0.1,
    },
  },
  // Tetris - falling blocks
  'tetris': {
    type: 'tetris',
    name: 'Tetris Blocks',
    parameters: {
      speed: 1.0,
      scale: 1.0,
      intensity: 0.9,
      origin: [0, 10, 0],
    },
    audioMappings: [
      { feature: 'beat', parameter: 'intensity', intensity: 1.0 },
      { feature: 'bass', parameter: 'speed', intensity: 0.6 },
    ],
    colorBehavior: {
      mode: 'cycle',
      cycleSpeed: 0.3,
    },
  },
  // Saturn - planet with rings
  'saturn': {
    type: 'saturn',
    name: 'Saturn',
    parameters: {
      speed: 0.5,
      scale: 1.0,
      intensity: 0.9,
      origin: [0, 6, 0],
    },
    audioMappings: [
      { feature: 'bass', parameter: 'scale', intensity: 0.7 },
      { feature: 'mid', parameter: 'speed', intensity: 0.5 },
    ],
    colorBehavior: {
      mode: 'cycle',
      cycleSpeed: 0.2,
    },
  },
};
