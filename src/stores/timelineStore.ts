import { create } from 'zustand';
import * as THREE from 'three';
import { PatternConfig, PatternType, DEFAULT_PATTERN_CONFIG } from '../patterns/types';

export interface TimelineClip {
  id: string;
  patternType: PatternType;
  patternConfig: PatternConfig;
  startTime: number;      // Start time in seconds
  duration: number;       // Duration in seconds
  track: number;          // Track/layer index (0-based)
}

interface TimelineStore {
  // State
  clips: TimelineClip[];
  isTimelineMode: boolean;
  showAlwaysOnPatterns: boolean;
  selectedClipId: string | null;
  zoom: number;           // Pixels per second
  scrollLeft: number;     // Scroll position in pixels

  // Actions
  addClip: (patternType: PatternType, startTime: number, track: number) => string;
  removeClip: (id: string) => void;
  updateClip: (id: string, updates: Partial<TimelineClip>) => void;
  updateClipAudioReactive: (id: string, audioReactive: boolean) => void;
  moveClip: (id: string, newStartTime: number, newTrack: number) => void;
  resizeClip: (id: string, newDuration: number, fromLeft?: boolean) => void;
  selectClip: (id: string | null) => void;
  setTimelineMode: (enabled: boolean) => void;
  setShowAlwaysOnPatterns: (show: boolean) => void;
  setZoom: (zoom: number) => void;
  setScrollLeft: (scrollLeft: number) => void;
  getActiveClips: (currentTime: number) => TimelineClip[];
  clearTimeline: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

// Default pattern configs for each type
const getDefaultPatternConfig = (type: PatternType, name: string): PatternConfig => ({
  ...DEFAULT_PATTERN_CONFIG,
  id: generateId(),
  type,
  name,
  enabled: true,
  audioReactive: true,
  parameters: {
    ...DEFAULT_PATTERN_CONFIG.parameters,
    direction: new THREE.Vector3(0, 1, 0),
    origin: new THREE.Vector3(0, 0, 0),
  },
});

// Pattern display names - matching PATTERN_INFO from claude.ts
const PATTERN_NAMES: Record<PatternType, string> = {
  wave: 'Expanding Sphere',
  firework: 'Burst Particles',
  rain: 'Falling Streaks',
  pulse: 'Beat Shells',
  blob: 'Drifting Orbs',
  custom: 'Custom',
  audioSpectrum: 'Audio Spectrum',
  verticalWave: 'Rising Tide',
  starfield: 'Starfield',
  tetris: 'Tetris Blocks',
  saturn: 'Saturn',
};

export const useTimelineStore = create<TimelineStore>((set, get) => ({
  clips: [],
  isTimelineMode: false,
  showAlwaysOnPatterns: true,
  selectedClipId: null,
  zoom: 50,        // 50 pixels per second default
  scrollLeft: 0,

  addClip: (patternType, startTime, track) => {
    const id = generateId();
    const clip: TimelineClip = {
      id,
      patternType,
      patternConfig: getDefaultPatternConfig(patternType, PATTERN_NAMES[patternType]),
      startTime: Math.max(0, startTime),
      duration: 10, // Default 10 seconds
      track: Math.max(0, track),
    };

    set((state) => ({
      clips: [...state.clips, clip],
      selectedClipId: id,
    }));

    return id;
  },

  removeClip: (id) => {
    set((state) => ({
      clips: state.clips.filter((c) => c.id !== id),
      selectedClipId: state.selectedClipId === id ? null : state.selectedClipId,
    }));
  },

  updateClip: (id, updates) => {
    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  updateClipAudioReactive: (id, audioReactive) => {
    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === id
          ? { ...c, patternConfig: { ...c.patternConfig, audioReactive } }
          : c
      ),
    }));
  },

  moveClip: (id, newStartTime, newTrack) => {
    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === id
          ? { ...c, startTime: Math.max(0, newStartTime), track: Math.max(0, newTrack) }
          : c
      ),
    }));
  },

  resizeClip: (id, newDuration, fromLeft = false) => {
    set((state) => ({
      clips: state.clips.map((c) => {
        if (c.id !== id) return c;

        const clampedDuration = Math.max(1, newDuration); // Minimum 1 second

        if (fromLeft) {
          // Resizing from left edge - adjust start time
          const deltaTime = c.duration - clampedDuration;
          return {
            ...c,
            startTime: Math.max(0, c.startTime + deltaTime),
            duration: clampedDuration,
          };
        }

        return { ...c, duration: clampedDuration };
      }),
    }));
  },

  selectClip: (id) => {
    set({ selectedClipId: id });
  },

  setTimelineMode: (enabled) => {
    set({ isTimelineMode: enabled });
  },

  setShowAlwaysOnPatterns: (show) => {
    set({ showAlwaysOnPatterns: show });
  },

  setZoom: (zoom) => {
    set({ zoom: Math.max(10, Math.min(200, zoom)) }); // 10-200 px/sec range
  },

  setScrollLeft: (scrollLeft) => {
    set({ scrollLeft: Math.max(0, scrollLeft) });
  },

  getActiveClips: (currentTime) => {
    const { clips, isTimelineMode } = get();

    if (!isTimelineMode) return [];

    return clips.filter((clip) => {
      const endTime = clip.startTime + clip.duration;
      return currentTime >= clip.startTime && currentTime < endTime;
    });
  },

  clearTimeline: () => {
    set({ clips: [], selectedClipId: null });
  },
}));
