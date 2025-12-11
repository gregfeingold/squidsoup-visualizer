import { PatternInput } from './PatternInput';
import { ColorSchemeSelector } from './ColorSchemeSelector';
import { GridConfigurator } from './GridConfigurator';
import { PatternList } from './PatternList';

export function ControlPanel() {
  return (
    <div className="h-full overflow-y-auto p-3 sm:p-5 space-y-3 sm:space-y-6 relative">
      {/* Header */}
      <div className="pb-2 sm:pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
          <div className="w-2 sm:w-3 h-2 sm:h-3 rounded-sm bg-[var(--accent-electric)] glow-electric" />
          <h1 className="font-display text-xl sm:text-3xl tracking-wide text-[var(--text-bright)]">
            SUBMERGENCE
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[var(--text-dim)] pl-4 sm:pl-6">
          Light grid visualizer inspired by Squidsoup
        </p>
      </div>

      {/* Sections - horizontal scroll on mobile, stacked on desktop */}
      <div className="flex lg:flex-col gap-3 sm:gap-5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 -mx-3 px-3 lg:mx-0 lg:px-0">
        {/* Pattern Generation */}
        <section className="panel p-3 sm:p-4 space-y-2 sm:space-y-4 min-w-[280px] lg:min-w-0 flex-shrink-0 lg:flex-shrink">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 sm:h-4 bg-[var(--accent-electric)] rounded-full" />
            <h2 className="font-display text-sm sm:text-lg tracking-wide text-[var(--text-mid)]">
              PATTERN ENGINE
            </h2>
          </div>
          <PatternInput />
        </section>

        {/* Active Patterns */}
        <section className="panel p-3 sm:p-4 space-y-2 sm:space-y-4 min-w-[280px] lg:min-w-0 flex-shrink-0 lg:flex-shrink">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 sm:h-4 bg-[var(--accent-cool)] rounded-full" />
            <h2 className="font-display text-sm sm:text-lg tracking-wide text-[var(--text-mid)]">
              ACTIVE PATTERNS
            </h2>
          </div>
          <PatternList />
        </section>

        {/* Color Scheme */}
        <section className="panel p-3 sm:p-4 space-y-2 sm:space-y-4 min-w-[280px] lg:min-w-0 flex-shrink-0 lg:flex-shrink">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 sm:h-4 bg-[var(--accent-hot)] rounded-full" />
            <h2 className="font-display text-sm sm:text-lg tracking-wide text-[var(--text-mid)]">
              COLOR PALETTE
            </h2>
          </div>
          <ColorSchemeSelector />
        </section>

        {/* Grid Config */}
        <section className="panel p-3 sm:p-4 space-y-2 sm:space-y-4 min-w-[280px] lg:min-w-0 flex-shrink-0 lg:flex-shrink">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 sm:h-4 bg-[var(--text-mid)] rounded-full" />
            <h2 className="font-display text-sm sm:text-lg tracking-wide text-[var(--text-mid)]">
              GRID CONFIG
            </h2>
          </div>
          <GridConfigurator />
        </section>
      </div>

      {/* Footer - hidden on mobile */}
      <div className="hidden sm:block pt-4 border-t border-[var(--border-subtle)]">
        <p className="font-mono text-[10px] text-[var(--text-dim)] text-center uppercase tracking-widest">
          v1.0 · Four Tet Tribute
        </p>
      </div>
    </div>
  );
}

export { PatternInput } from './PatternInput';
export { ColorSchemeSelector } from './ColorSchemeSelector';
export { GridConfigurator } from './GridConfigurator';
export { PatternList } from './PatternList';
