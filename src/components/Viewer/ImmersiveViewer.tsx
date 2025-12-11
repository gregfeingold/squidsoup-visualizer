import { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Grid } from '@react-three/drei';
import { LightGrid } from './LightGrid';
import { FirstPersonControls } from './FirstPersonControls';
import { ConcertEnvironment } from './ConcertEnvironment';
import { useViewerStore } from '../../stores/viewerStore';
import { useAudioStore } from '../../stores/audioStore';

export function ImmersiveViewer() {
  const [isLocked, setIsLocked] = useState(false);
  const { toggleMode, showUI, setShowUI, toggleFullscreen, isFullscreen } = useViewerStore();
  const { isPlaying, analysis } = useAudioStore();

  const handlePointerLockChange = useCallback(() => {
    setIsLocked(document.pointerLockElement !== null);
  }, []);

  useEffect(() => {
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [handlePointerLockChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && !isLocked) {
        toggleMode();
      }
      if (e.code === 'KeyH') {
        setShowUI(!showUI);
      }
      if (e.code === 'KeyF') {
        toggleFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLocked, toggleMode, showUI, setShowUI, toggleFullscreen]);

  return (
    <div className="relative w-full h-full bg-[#1a1a1f]">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 1.6, 12]} fov={75} />
        <FirstPersonControls speed={5} enabled={true} />

        {/* Very dark ambient - concert darkness */}
        <ambientLight intensity={0.01} />

        {/* Dense fog for atmosphere */}
        <fog attach="fog" args={['#1a1a1f', 20, 60]} />

        {/* No grid floor in immersive - just darkness below */}
        <Grid
          position={[0, 0, 0]}
          args={[100, 100]}
          cellSize={2}
          cellThickness={0.2}
          cellColor="#050510"
          sectionSize={10}
          sectionThickness={0.3}
          sectionColor="#0a0a20"
          fadeDistance={40}
          fadeStrength={1}
          infiniteGrid
        />

        {/* Concert environment */}
        <ConcertEnvironment />

        {/* The light grid - this is the star of the show */}
        <LightGrid />
      </Canvas>

      {/* UI Overlay */}
      {showUI && (
        <>
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent">
            <button
              onClick={toggleMode}
              className="flex items-center gap-2 px-3 py-2 bg-black/60 hover:bg-black/80 border border-white/10 rounded-lg text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Exit
            </button>

            <div className="flex items-center gap-3">
              {/* BPM indicator */}
              {isPlaying && analysis.bpm > 0 && (
                <div className={`px-3 py-1.5 rounded-full text-sm font-mono transition-all ${
                  analysis.beat
                    ? 'bg-purple-500/80 scale-110'
                    : 'bg-black/60 border border-white/10'
                }`}>
                  {analysis.bpm} BPM
                </div>
              )}

              {/* Audio levels mini display */}
              {isPlaying && (
                <div className="flex items-end gap-1 h-6 px-2 py-1 bg-black/60 rounded border border-white/10">
                  <div className="w-1.5 bg-red-500 transition-all" style={{ height: `${analysis.bass * 100}%` }} />
                  <div className="w-1.5 bg-yellow-500 transition-all" style={{ height: `${analysis.mid * 100}%` }} />
                  <div className="w-1.5 bg-cyan-500 transition-all" style={{ height: `${analysis.treble * 100}%` }} />
                </div>
              )}

              {/* Fullscreen toggle */}
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-black/60 hover:bg-black/80 border border-white/10 rounded-lg transition-colors"
              >
                {isFullscreen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Bottom instructions */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
            <div className="flex items-center justify-center gap-6 text-sm text-white/60">
              {!isLocked && (
                <span className="animate-pulse text-white/80">Click anywhere to look around</span>
              )}
              {isLocked && (
                <>
                  <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">WASD</kbd> Move</span>
                  <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">Space</kbd> Up</span>
                  <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">Shift</kbd> Down</span>
                  <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">ESC</kbd> Release mouse</span>
                </>
              )}
              <span className="border-l border-white/20 pl-6"><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">H</kbd> Hide UI</span>
              <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">F</kbd> Fullscreen</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
