import { useEffect, useState } from 'react';
import { useWalkthroughStore } from '../../stores/walkthroughStore';

export function WelcomeModal() {
  const { hasCompletedWalkthrough, isActive, startWalkthrough, skipWalkthrough } = useWalkthroughStore();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show modal on first load if walkthrough hasn't been completed
    if (!hasCompletedWalkthrough && !isActive) {
      // Small delay for smoother UX
      const timer = setTimeout(() => setShow(true), 500);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedWalkthrough, isActive]);

  if (!show) return null;

  const handleStart = () => {
    setShow(false);
    startWalkthrough();
  };

  const handleSkip = () => {
    setShow(false);
    skipWalkthrough();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-md w-full mx-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl overflow-hidden shadow-2xl">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-electric)]/10 via-transparent to-[var(--accent-hot)]/10 pointer-events-none" />

        {/* Content */}
        <div className="relative p-6 sm:p-8">
          {/* Logo/Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 rounded-sm bg-[var(--accent-electric)] glow-electric" />
            <h1 className="font-display text-2xl sm:text-3xl tracking-wide text-[var(--text-bright)]">
              GREGSOUP
            </h1>
          </div>

          <p className="text-[var(--text-mid)] mb-2">
            Welcome to the light grid visualizer inspired by Squidsoup's concert installations.
          </p>

          <p className="text-[var(--text-dim)] text-sm mb-6">
            Create mesmerizing light shows by describing patterns, uploading music, and walking through your creation in immersive 3D.
          </p>

          {/* Feature highlights */}
          <div className="space-y-3 mb-8">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 mt-2 rounded-full bg-[var(--accent-electric)]" />
              <div>
                <span className="text-[var(--text-bright)] text-sm font-medium">AI-Powered Patterns</span>
                <p className="text-[var(--text-dim)] text-xs">Describe patterns in plain English</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 mt-2 rounded-full bg-[var(--accent-cool)]" />
              <div>
                <span className="text-[var(--text-bright)] text-sm font-medium">Audio Reactive</span>
                <p className="text-[var(--text-dim)] text-xs">Lights respond to your music in real-time</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 mt-2 rounded-full bg-[var(--accent-hot)]" />
              <div>
                <span className="text-[var(--text-bright)] text-sm font-medium">Immersive Experience</span>
                <p className="text-[var(--text-dim)] text-xs">Walk through your light installation</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleStart}
              className="flex-1 px-6 py-3 btn-primary rounded-lg text-sm uppercase tracking-wider font-semibold"
            >
              Take the Tour
            </button>
            <button
              onClick={handleSkip}
              className="flex-1 px-6 py-3 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)]/80 border border-[var(--border-subtle)] rounded-lg text-sm text-[var(--text-mid)] uppercase tracking-wider transition-colors"
            >
              Skip for Now
            </button>
          </div>

          {/* Reset hint */}
          <p className="text-center text-[var(--text-dim)] text-xs mt-4">
            You can restart the tour anytime from settings
          </p>
        </div>
      </div>
    </div>
  );
}
