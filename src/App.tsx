import { ControlPanel } from './components/ControlPanel';
import { MiniViewer } from './components/Preview/MiniViewer';
import { ImmersiveViewer } from './components/Viewer/ImmersiveViewer';
import { TimelineEditor } from './components/Timeline';
import { useViewerStore } from './stores/viewerStore';

function App() {
  const { mode, toggleMode } = useViewerStore();

  if (mode === 'immersive') {
    return <ImmersiveViewer />;
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-void)] text-[var(--text-bright)] overflow-hidden">
      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        {/* Control Panel - glass morphism sidebar */}
        <div className="w-[380px] flex-shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-deep)] relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(0,255,136,0.02)] to-transparent pointer-events-none" />
          <ControlPanel />
        </div>

        {/* Preview Area */}
        <div className="flex-1 flex flex-col relative scanline-overlay min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-deep)]/80 backdrop-blur-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[var(--accent-electric)] animate-pulse" />
                <h2 className="font-display text-xl tracking-wider text-[var(--text-mid)]">VIEWPORT</h2>
              </div>
              <div className="h-4 w-px bg-[var(--border-subtle)]" />
              <span className="font-mono text-xs text-[var(--text-dim)] uppercase tracking-wide">
                Orbit: drag &middot; Zoom: scroll
              </span>
            </div>

            <button
              onClick={toggleMode}
              className="group flex items-center gap-3 px-5 py-2.5 btn-primary rounded-lg text-sm uppercase tracking-wider"
            >
              <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Enter Experience
            </button>
          </div>

          {/* 3D Preview */}
          <div className="flex-1 relative min-h-0">
            <MiniViewer />

            {/* Corner decorations */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[var(--accent-electric)]/30 pointer-events-none" />
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[var(--accent-electric)]/30 pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[var(--accent-electric)]/30 pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[var(--accent-electric)]/30 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Timeline Editor - bottom bar */}
      <TimelineEditor />
    </div>
  );
}

export default App;
