import { create } from 'zustand';

export type ViewMode = 'editor' | 'immersive';

interface ViewerStore {
  // View mode
  mode: ViewMode;

  // Camera state for immersive mode
  cameraPosition: [number, number, number];
  cameraRotation: [number, number];

  // Viewer settings
  showUI: boolean;
  isFullscreen: boolean;

  // Performance
  targetFPS: number;
  showStats: boolean;

  // Actions
  setMode: (mode: ViewMode) => void;
  toggleMode: () => void;
  setCameraPosition: (position: [number, number, number]) => void;
  setCameraRotation: (rotation: [number, number]) => void;
  setShowUI: (show: boolean) => void;
  setIsFullscreen: (fullscreen: boolean) => void;
  toggleFullscreen: () => void;
  setShowStats: (show: boolean) => void;
}

export const useViewerStore = create<ViewerStore>((set, get) => ({
  mode: 'editor',

  cameraPosition: [0, 1.6, 5], // Eye level, 5 units back
  cameraRotation: [0, 0],

  showUI: true,
  isFullscreen: false,

  targetFPS: 60,
  showStats: false,

  setMode: (mode) => set({ mode }),

  toggleMode: () => set((state) => ({
    mode: state.mode === 'editor' ? 'immersive' : 'editor',
  })),

  setCameraPosition: (position) => set({ cameraPosition: position }),

  setCameraRotation: (rotation) => set({ cameraRotation: rotation }),

  setShowUI: (show) => set({ showUI: show }),

  setIsFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),

  toggleFullscreen: () => {
    const { isFullscreen } = get();
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    set({ isFullscreen: !isFullscreen });
  },

  setShowStats: (show) => set({ showStats: show }),
}));
