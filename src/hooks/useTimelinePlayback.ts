import { useMemo } from 'react';
import { useTimelineStore } from '../stores/timelineStore';
import { useAudioStore } from '../stores/audioStore';
import { usePatternStore } from '../stores/patternStore';
import { PatternConfig } from '../patterns/types';

/**
 * Hook that provides the list of active patterns based on timeline state.
 * When timeline mode is ON, returns clips active at current audio time (timeline-driven).
 * When timeline mode is OFF, returns always-on patterns from patternStore.
 */
export function useTimelinePlayback(): PatternConfig[] {
  const { clips, isTimelineMode, getActiveClips } = useTimelineStore();
  const { currentTime } = useAudioStore();
  const { patterns } = usePatternStore();

  return useMemo(() => {
    // Get always-on patterns (enabled patterns from pattern store)
    const alwaysOnPatterns = patterns.filter(p => p.enabled);

    if (!isTimelineMode) {
      // Timeline mode OFF - use always-on patterns (patterns from left panel)
      return alwaysOnPatterns;
    }

    // Timeline mode ON - get active clips at current time (timeline-driven only)
    const activeClips = getActiveClips(currentTime);
    const timelinePatterns = activeClips.map(clip => ({
      ...clip.patternConfig,
      enabled: true, // Force enabled for timeline clips
    }));

    return timelinePatterns;
  }, [patterns, clips, isTimelineMode, currentTime, getActiveClips]);
}
