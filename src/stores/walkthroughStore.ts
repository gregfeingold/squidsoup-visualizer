import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WalkthroughStep =
  | 'welcome'
  | 'pattern-input'
  | 'color-scheme'
  | 'audio-upload'
  | 'timeline'
  | 'immersive'
  | 'complete';

interface WalkthroughStore {
  currentStep: WalkthroughStep;
  hasCompletedWalkthrough: boolean;
  isActive: boolean;

  startWalkthrough: () => void;
  nextStep: () => void;
  skipWalkthrough: () => void;
  resetWalkthrough: () => void;
}

const STEP_ORDER: WalkthroughStep[] = [
  'welcome',
  'pattern-input',
  'color-scheme',
  'audio-upload',
  'timeline',
  'immersive',
  'complete',
];

export const useWalkthroughStore = create<WalkthroughStore>()(
  persist(
    (set, get) => ({
      currentStep: 'welcome',
      hasCompletedWalkthrough: false,
      isActive: false,

      startWalkthrough: () => {
        set({ isActive: true, currentStep: 'welcome' });
      },

      nextStep: () => {
        const { currentStep } = get();
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        const nextIndex = currentIndex + 1;

        if (nextIndex >= STEP_ORDER.length - 1) {
          // Reached complete
          set({
            currentStep: 'complete',
            hasCompletedWalkthrough: true,
            isActive: false
          });
        } else {
          set({ currentStep: STEP_ORDER[nextIndex] });
        }
      },

      skipWalkthrough: () => {
        set({
          hasCompletedWalkthrough: true,
          isActive: false,
          currentStep: 'complete'
        });
      },

      resetWalkthrough: () => {
        set({
          hasCompletedWalkthrough: false,
          isActive: false,
          currentStep: 'welcome'
        });
      },
    }),
    {
      name: 'squidsoup-walkthrough',
      partialize: (state) => ({
        hasCompletedWalkthrough: state.hasCompletedWalkthrough
      }),
    }
  )
);
