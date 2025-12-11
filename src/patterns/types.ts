import * as THREE from 'three';

export type PatternType = 'wave' | 'firework' | 'rain' | 'pulse' | 'blob' | 'custom' | 'audioSpectrum' | 'verticalWave' | 'starfield' | 'tetris' | 'saturn';

export type AudioFeature = 'bass' | 'mid' | 'treble' | 'amplitude' | 'beat';

export interface AudioMapping {
  feature: AudioFeature;
  parameter: string;
  intensity: number; // 0-1 how much the audio affects the parameter
  invert?: boolean;
}

export interface PatternConfig {
  id: string;
  type: PatternType;
  name: string;
  enabled: boolean;
  audioReactive: boolean; // Whether this pattern responds to audio
  parameters: {
    speed: number;        // 0-2, default 1
    scale: number;        // 0-2, default 1
    intensity: number;    // 0-1, default 0.5
    direction: THREE.Vector3;
    origin: THREE.Vector3;
    frequency?: number;   // For wave patterns
    decay?: number;       // For firework/pulse
    spread?: number;      // For rain/blob
  };
  audioMappings: AudioMapping[];
  colorBehavior: {
    mode: 'static' | 'cycle' | 'reactive';
    cycleSpeed?: number;
    reactTo?: AudioFeature;
  };
}

export interface GridConfig {
  mode: '3d' | '2d';
  dimensions: {
    width: number;
    height: number;
    depth: number;  // Only used in 3D mode
  };
  pointCount: number;
  distribution: 'grid' | 'random' | 'organic';
}

export interface ColorScheme {
  id: string;
  name: string;
  colors: string[];
}

export interface LightPoint {
  position: THREE.Vector3;
  baseColor: THREE.Color;
  currentColor: THREE.Color;
  intensity: number;
  index: number;
}

export interface AudioAnalysis {
  bass: number;
  mid: number;
  treble: number;
  amplitude: number;
  beat: boolean;
  bpm: number;
  frequencyData: Uint8Array;
  timestamp: number;
}

export const DEFAULT_COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'neon',
    name: 'Neon',
    colors: ['#ff00ff', '#00ffff', '#ff0080', '#00ff80', '#8000ff'],
  },
  {
    id: 'warm',
    name: 'Warm',
    colors: ['#ff4400', '#ff8800', '#ffcc00', '#ff6600', '#ff2200'],
  },
  {
    id: 'cool',
    name: 'Cool',
    colors: ['#0044ff', '#0088ff', '#00ccff', '#0066ff', '#00aaff'],
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    colors: ['#ffffff', '#cccccc', '#999999', '#666666', '#333333'],
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    colors: ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0000ff', '#8800ff'],
  },
  {
    id: 'fourtet',
    name: 'Four Tet',
    colors: ['#ff3366', '#33ff99', '#3366ff', '#ffff33', '#ff33ff'],
  },
];

export const DEFAULT_GRID_CONFIG: GridConfig = {
  mode: '3d',
  dimensions: {
    width: 20,
    height: 10,
    depth: 20,
  },
  pointCount: 5000, // Reduced for better performance
  distribution: 'random',
};

export const DEFAULT_PATTERN_CONFIG: Omit<PatternConfig, 'id' | 'name'> = {
  type: 'wave',
  enabled: true,
  audioReactive: true,
  parameters: {
    speed: 1,
    scale: 1,
    intensity: 0.5,
    direction: new THREE.Vector3(0, 1, 0),
    origin: new THREE.Vector3(0, 0, 0),
    frequency: 1,
    decay: 0.5,
    spread: 1,
  },
  audioMappings: [
    { feature: 'bass', parameter: 'intensity', intensity: 0.8 },
    { feature: 'beat', parameter: 'speed', intensity: 0.5 },
  ],
  colorBehavior: {
    mode: 'reactive',
    reactTo: 'amplitude',
  },
};
