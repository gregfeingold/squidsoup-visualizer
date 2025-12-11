import { useEffect, useRef } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { MiniViewer } from './components/Preview/MiniViewer';
import { ImmersiveViewer } from './components/Viewer/ImmersiveViewer';
import { TimelineEditor } from './components/Timeline';
import { WelcomeModal, WalkthroughTooltip } from './components/Walkthrough';
import { useViewerStore } from './stores/viewerStore';
import { useAudioStore } from './stores/audioStore';
import { audioAnalyzer } from './services/audioAnalyzer';

function App() {
  const { mode, toggleMode } = useViewerStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    audioUrl,
    setAudioElement,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setAnalysis,
    detectBeat,
  } = useAudioStore();

  // Register audio element with store
  useEffect(() => {
    if (audioRef.current) {
      setAudioElement(audioRef.current);
    }
  }, [setAudioElement]);

  // Setup audio event handlers when URL changes
  useEffect(() => {
    if (!audioUrl || !audioRef.current) return;

    const audio = audioRef.current;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);

    // Initialize audio analyzer
    const initAnalyzer = async () => {
      await audioAnalyzer.initialize(audio);

      // Start analysis loop
      const analyzeLoop = () => {
        if (!audio.paused) {
          const analysis = audioAnalyzer.analyze();
          setAnalysis(analysis);
          if (analysis.amplitude > 0) {
            detectBeat(analysis.amplitude);
          }
        }
        requestAnimationFrame(analyzeLoop);
      };
      analyzeLoop();
    };

    initAnalyzer();
  }, [audioUrl, setDuration, setCurrentTime, setIsPlaying, setAnalysis, detectBeat]);

  if (mode === 'immersive') {
    return (
      <>
        {/* Persistent audio element - always rendered */}
        <audio ref={audioRef} src={audioUrl || undefined} />
        <ImmersiveViewer />
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-void)] text-[var(--text-bright)] overflow-hidden">
      {/* Persistent audio element - always rendered */}
      <audio ref={audioRef} src={audioUrl || undefined} />

      {/* Main content area - stack on mobile, side-by-side on desktop */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
        {/* Control Panel - full width on mobile, fixed width on desktop */}
        <div className="w-full lg:w-[380px] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--border-subtle)] bg-[var(--bg-deep)] relative z-20 h-auto lg:h-full lg:overflow-y-auto">
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(0,255,136,0.02)] to-transparent pointer-events-none" />
          <ControlPanel />
        </div>

        {/* Preview Area */}
        <div className="flex-1 flex flex-col relative z-10 scanline-overlay min-w-0 min-h-0">
          {/* Header - simplified on mobile */}
          <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-deep)]/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 sm:gap-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-2 h-2 rounded-full bg-[var(--accent-electric)] animate-pulse" />
                <h2 className="font-display text-base sm:text-xl tracking-wider text-[var(--text-mid)]">VIEWPORT</h2>
              </div>
              <span className="hidden sm:inline font-mono text-xs text-[var(--text-dim)] uppercase tracking-wide">
                Orbit: drag · Zoom: scroll
              </span>
            </div>

            <WalkthroughTooltip step="immersive">
              <button
                onClick={toggleMode}
                className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-2.5 btn-primary rounded-lg text-xs sm:text-sm uppercase tracking-wider"
              >
                <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="hidden xs:inline">Enter</span> Experience
              </button>
            </WalkthroughTooltip>
          </div>

          {/* 3D Preview */}
          <div className="flex-1 relative min-h-[200px]">
            <MiniViewer />

            {/* Corner decorations - hidden on mobile */}
            <div className="hidden sm:block absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[var(--accent-electric)]/30 pointer-events-none" />
            <div className="hidden sm:block absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[var(--accent-electric)]/30 pointer-events-none" />
            <div className="hidden sm:block absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[var(--accent-electric)]/30 pointer-events-none" />
            <div className="hidden sm:block absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[var(--accent-electric)]/30 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Timeline Editor - bottom bar */}
      <WalkthroughTooltip step="timeline">
        <TimelineEditor />
      </WalkthroughTooltip>

      {/* Welcome Modal for first-time users */}
      <WelcomeModal />
    </div>
  );
}

export default App;
