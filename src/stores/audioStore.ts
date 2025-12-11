import { create } from 'zustand';
import { AudioAnalysis } from '../patterns/types';

interface AudioStore {
  // Audio file
  audioFile: File | null;
  audioUrl: string | null;
  audioElement: HTMLAudioElement | null;

  // Playback state
  isPlaying: boolean;
  currentTime: number;
  duration: number;

  // Analysis
  analysis: AudioAnalysis;
  analyserNode: AnalyserNode | null;
  audioContext: AudioContext | null;

  // Beat detection
  lastBeatTime: number;
  beatThreshold: number;
  bpmHistory: number[];

  // Actions
  setAudioFile: (file: File | null) => void;
  setAudioElement: (element: HTMLAudioElement | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setAnalysis: (analysis: Partial<AudioAnalysis>) => void;
  setAnalyserNode: (node: AnalyserNode | null) => void;
  setAudioContext: (context: AudioContext | null) => void;

  // Beat detection
  detectBeat: (currentAmplitude: number) => boolean;
  updateBPM: (beatTime: number) => void;

  // Cleanup
  cleanup: () => void;
}

const DEFAULT_ANALYSIS: AudioAnalysis = {
  bass: 0,
  mid: 0,
  treble: 0,
  amplitude: 0,
  beat: false,
  bpm: 0,
  frequencyData: new Uint8Array(0),
  timestamp: 0,
};

export const useAudioStore = create<AudioStore>((set, get) => ({
  audioFile: null,
  audioUrl: null,
  audioElement: null,

  isPlaying: false,
  currentTime: 0,
  duration: 0,

  analysis: DEFAULT_ANALYSIS,
  analyserNode: null,
  audioContext: null,

  lastBeatTime: 0,
  beatThreshold: 0.7,
  bpmHistory: [],

  setAudioFile: (file) => {
    const { audioUrl } = get();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    const newUrl = file ? URL.createObjectURL(file) : null;
    set({ audioFile: file, audioUrl: newUrl });
  },

  setAudioElement: (element) => set({ audioElement: element }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setCurrentTime: (time) => set({ currentTime: time }),

  setDuration: (duration) => set({ duration: duration }),

  setAnalysis: (analysis) => set((state) => ({
    analysis: { ...state.analysis, ...analysis },
  })),

  setAnalyserNode: (node) => set({ analyserNode: node }),

  setAudioContext: (context) => set({ audioContext: context }),

  detectBeat: (currentAmplitude) => {
    const { beatThreshold, analysis, lastBeatTime } = get();
    const now = performance.now();

    // Minimum time between beats (200ms = 300 BPM max)
    if (now - lastBeatTime < 200) return false;

    // Simple beat detection: amplitude crosses threshold
    const isBeat = currentAmplitude > beatThreshold && analysis.amplitude <= beatThreshold;

    if (isBeat) {
      set({ lastBeatTime: now });
      get().updateBPM(now);
    }

    return isBeat;
  },

  updateBPM: (beatTime) => {
    const { lastBeatTime, bpmHistory } = get();
    if (lastBeatTime > 0) {
      const interval = beatTime - lastBeatTime;
      const instantBPM = 60000 / interval;

      // Only consider reasonable BPM values (60-200)
      if (instantBPM >= 60 && instantBPM <= 200) {
        const newHistory = [...bpmHistory, instantBPM].slice(-10);
        const avgBPM = newHistory.reduce((a, b) => a + b, 0) / newHistory.length;
        set({ bpmHistory: newHistory, analysis: { ...get().analysis, bpm: Math.round(avgBPM) } });
      }
    }
  },

  cleanup: () => {
    const { audioUrl, audioContext } = get();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (audioContext) audioContext.close();
    set({
      audioFile: null,
      audioUrl: null,
      audioElement: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      analysis: DEFAULT_ANALYSIS,
      analyserNode: null,
      audioContext: null,
      bpmHistory: [],
    });
  },
}));
