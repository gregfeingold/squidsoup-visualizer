import { useEffect, useRef, useState } from 'react';
import { useWalkthroughStore, WalkthroughStep } from '../../stores/walkthroughStore';

interface TooltipContent {
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const STEP_CONTENT: Record<WalkthroughStep, TooltipContent | null> = {
  welcome: null, // Handled by WelcomeModal
  'pattern-input': {
    title: 'Create Your First Pattern',
    description: 'Describe a light pattern in natural language, like "waves rippling from center" or "fireworks exploding upward". Click Generate to create it!',
    position: 'right',
  },
  'color-scheme': {
    title: 'Choose Your Colors',
    description: 'Select a color palette for your light show. Each scheme creates a different mood and atmosphere.',
    position: 'right',
  },
  'audio-upload': {
    title: 'Add Your Music',
    description: 'Upload an audio file to make your patterns react to the beat. The visualizer analyzes bass, mids, and treble in real-time.',
    position: 'right',
  },
  timeline: {
    title: 'Sequence Your Patterns',
    description: 'Drag patterns onto the timeline to choreograph your light show. Resize clips to control timing.',
    position: 'top',
  },
  immersive: {
    title: 'Enter the Experience',
    description: 'Click here to enter immersive mode and walk through your light installation in first-person!',
    position: 'bottom',
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
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  const content = STEP_CONTENT[step];
  const isCurrentStep = isActive && currentStep === step && content;

  useEffect(() => {
    if (isCurrentStep && containerRef.current) {
      // Scroll the element into view
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isCurrentStep]);

  if (!content) {
    return <>{children}</>;
  }

  const getTooltipClasses = () => {
    const base = 'absolute z-50 bg-[var(--bg-elevated)] border border-[var(--accent-electric)] rounded-lg p-4 shadow-xl max-w-xs';
    const glow = 'shadow-[0_0_20px_rgba(0,255,136,0.3)]';

    switch (content.position) {
      case 'top':
        return `${base} ${glow} bottom-full left-1/2 -translate-x-1/2 mb-3`;
      case 'bottom':
        return `${base} ${glow} top-full left-1/2 -translate-x-1/2 mt-3`;
      case 'left':
        return `${base} ${glow} right-full top-1/2 -translate-y-1/2 mr-3`;
      case 'right':
        return `${base} ${glow} left-full top-1/2 -translate-y-1/2 ml-3`;
    }
  };

  const getArrowClasses = () => {
    const base = 'absolute w-3 h-3 bg-[var(--bg-elevated)] border-[var(--accent-electric)] transform rotate-45';

    switch (content.position) {
      case 'top':
        return `${base} bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-r border-b`;
      case 'bottom':
        return `${base} top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-l border-t`;
      case 'left':
        return `${base} right-0 top-1/2 -translate-y-1/2 translate-x-1/2 border-t border-r`;
      case 'right':
        return `${base} left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 border-b border-l`;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Highlight ring when active */}
      <div className={`${isCurrentStep ? 'ring-2 ring-[var(--accent-electric)] ring-offset-2 ring-offset-[var(--bg-deep)] rounded-lg' : ''}`}>
        {children}
      </div>

      {/* Tooltip */}
      {isCurrentStep && (
        <div className={getTooltipClasses()}>
          <div className={getArrowClasses()} />

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
        </div>
      )}
    </div>
  );
}
