import { create } from 'zustand';
import * as THREE from 'three';
import {
  PatternConfig,
  GridConfig,
  ColorScheme,
  DEFAULT_COLOR_SCHEMES,
  DEFAULT_GRID_CONFIG,
  DEFAULT_PATTERN_CONFIG,
  PatternType
} from '../patterns/types';

interface PatternStore {
  // Patterns
  patterns: PatternConfig[];
  activePatternId: string | null;

  // Grid
  gridConfig: GridConfig;

  // Colors
  colorSchemes: ColorScheme[];
  activeColorSchemeId: string;
  customColors: string[];

  // Pattern description (for Claude API)
  patternDescription: string;
  isGenerating: boolean;

  // Actions
  addPattern: (pattern: PatternConfig) => void;
  removePattern: (id: string) => void;
  updatePattern: (id: string, updates: Partial<PatternConfig>) => void;
  togglePattern: (id: string) => void;
  toggleAudioReactive: (id: string) => void;
  setActivePattern: (id: string | null) => void;

  setGridConfig: (config: Partial<GridConfig>) => void;

  setActiveColorScheme: (id: string) => void;
  setCustomColors: (colors: string[]) => void;

  setPatternDescription: (description: string) => void;
  setIsGenerating: (generating: boolean) => void;

  // Generate pattern from Claude response
  addPatternFromGeneration: (type: PatternType, name: string, params: Partial<PatternConfig['parameters']>) => void;

  // Clear all patterns
  clearPatterns: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const usePatternStore = create<PatternStore>((set, get) => ({
  patterns: [],
  activePatternId: null,

  gridConfig: DEFAULT_GRID_CONFIG,

  colorSchemes: DEFAULT_COLOR_SCHEMES,
  activeColorSchemeId: 'neon',
  customColors: [],

  patternDescription: '',
  isGenerating: false,

  addPattern: (pattern) => set((state) => ({
    patterns: [...state.patterns, pattern],
    activePatternId: pattern.id,
  })),

  removePattern: (id) => set((state) => ({
    patterns: state.patterns.filter((p) => p.id !== id),
    activePatternId: state.activePatternId === id ? null : state.activePatternId,
  })),

  updatePattern: (id, updates) => set((state) => ({
    patterns: state.patterns.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    ),
  })),

  togglePattern: (id) => set((state) => ({
    patterns: state.patterns.map((p) =>
      p.id === id ? { ...p, enabled: !p.enabled } : p
    ),
  })),

  toggleAudioReactive: (id) => set((state) => ({
    patterns: state.patterns.map((p) =>
      p.id === id ? { ...p, audioReactive: !p.audioReactive } : p
    ),
  })),

  setActivePattern: (id) => set({ activePatternId: id }),

  setGridConfig: (config) => set((state) => ({
    gridConfig: { ...state.gridConfig, ...config },
  })),

  setActiveColorScheme: (id) => set({ activeColorSchemeId: id }),

  setCustomColors: (colors) => set({ customColors: colors }),

  setPatternDescription: (description) => set({ patternDescription: description }),

  setIsGenerating: (generating) => set({ isGenerating: generating }),

  addPatternFromGeneration: (type, name, params) => {
    const id = generateId();
    const pattern: PatternConfig = {
      ...DEFAULT_PATTERN_CONFIG,
      id,
      type,
      name,
      parameters: {
        ...DEFAULT_PATTERN_CONFIG.parameters,
        ...params,
        direction: params.direction || new THREE.Vector3(0, 1, 0),
        origin: params.origin || new THREE.Vector3(0, 0, 0),
      },
    };
    get().addPattern(pattern);
  },

  clearPatterns: () => set({ patterns: [], activePatternId: null }),
}));
