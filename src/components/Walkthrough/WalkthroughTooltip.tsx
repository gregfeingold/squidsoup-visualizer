import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWalkthroughStore, WalkthroughStep } from '../../stores/walkthroughStore';

interface TooltipContent {
  title: string;
  description: string;
}

const STEP_CONTENT: Record<WalkthroughStep, TooltipContent | null> = {
  welcome: null, // Handled by WelcomeModal
  'pattern-input': {
    title: 'Create Your First Pattern',
    description: 'Start with one of our preset patterns below! To describe your own custom patterns, you\'ll need to add a Claude API key in the input field.',
  },
  'color-scheme': {
    title: 'Choose Your Colors',
    description: 'Select a color palette for your light show. Each scheme creates a different mood and atmosphere.',
  },
  'audio-upload': {
    title: 'Add Your Music',
    description: 'Upload an audio file to sync your light show to music. Each pattern has a toggle to make it audio-reactive, responding to bass, mids, and treble in real-time.',
  },
  timeline: {
    title: 'Sequence Your Patterns',
    description: 'String together different patterns to create a full light show for a performance. Drag patterns onto the timeline and resize clips to control timing.',
  },
  immersive: {
    title: 'Enter the Experience',
    description: 'Click here to enter immersive mode and walk through your light installation in first-person!',
  },
  complete: null,
};

interface WalkthroughTooltipProps {
  step: WalkthroughStep;
  children: React.ReactNode;
}

export function WalkthroughTooltip({ step, children }: WalkthroughTooltipProps) {
  const { currentStep, isActive, nextStep, skipWalkthrough } = useWalkthroughStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const content = STEP_CONTENT[step];
  const isCurrentStep = isActive && currentStep === step && content;

  // Calculate tooltip position based on element location
  useEffect(() => {
    if (isCurrentStep && containerRef.current) {
      // With display:contents, we need to get the first child element's rect
      const targetElement = containerRef.current.firstElementChild as HTMLElement | null;
      if (!targetElement) return;

      const rect = targetElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Position tooltip to the right of element, or below on mobile
      let top = rect.top + rect.height / 2;
      let left = rect.right + 16;

      // If tooltip would go off right edge, position below instead
      if (left + 320 > viewportWidth) {
        top = rect.bottom + 16;
        left = Math.max(16, rect.left);
      }

      // Keep within viewport
      top = Math.max(16, Math.min(top, viewportHeight - 200));
      left = Math.max(16, Math.min(left, viewportWidth - 336));

      setTooltipPosition({ top, left });

      // Scroll element into view
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isCurrentStep]);

  if (!content) {
    return <>{children}</>;
  }

  // For the highlight ring, we add it via portal overlay instead of wrapping
  return (
    <>
      <div ref={containerRef} style={{ display: 'contents' }}>
        {children}
      </div>

      {/* Highlight ring overlay - rendered via portal */}
      {isCurrentStep && containerRef.current && createPortal(
        <div
          className="fixed pointer-events-none z-[9998] ring-2 ring-[var(--accent-electric)] ring-offset-2 ring-offset-[var(--bg-deep)] rounded-lg"
          style={{
            top: containerRef.current.firstElementChild?.getBoundingClientRect().top ?? 0,
            left: containerRef.current.firstElementChild?.getBoundingClientRect().left ?? 0,
            width: containerRef.current.firstElementChild?.getBoundingClientRect().width ?? 0,
            height: containerRef.current.firstElementChild?.getBoundingClientRect().height ?? 0,
          }}
        />,
        document.body
      )}

      {/* Tooltip - rendered via portal to avoid overflow issues */}
      {isCurrentStep && createPortal(
        <div
          className="fixed z-[9999] bg-[var(--bg-elevated)] border-2 border-[var(--accent-electric)] rounded-lg p-4 shadow-xl max-w-xs"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            boxShadow: '0 0 30px rgba(0, 255, 136, 0.4)',
          }}
        >
          <div className="relative">
            <h3 className="font-display text-lg text-[var(--accent-electric)] mb-2">
              {content.title}
            </h3>
            <p className="text-sm text-[var(--text-mid)] mb-4">
              {content.description}
            </p>

            <div className="flex items-center justify-between gap-3">
              <button
                onClick={skipWalkthrough}
                className="text-xs text-[var(--text-dim)] hover:text-[var(--text-mid)] transition-colors"
              >
                Skip tour
              </button>
              <button
                onClick={nextStep}
                className="px-4 py-1.5 bg-[var(--accent-electric)] text-[var(--bg-void)] text-sm font-semibold rounded hover:brightness-110 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
