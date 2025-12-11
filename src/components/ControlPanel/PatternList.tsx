import { usePatternStore } from '../../stores/patternStore';
import { PATTERN_INFO } from '../../services/claude';

export function PatternList() {
  const { patterns, activePatternId, togglePattern, toggleAudioReactive, removePattern, setActivePattern } = usePatternStore();

  if (patterns.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed border-[var(--border-subtle)] rounded-lg">
        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-[var(--bg-void)] flex items-center justify-center">
          <svg className="w-5 h-5 text-[var(--text-dim)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <p className="font-mono text-xs text-[var(--text-dim)] uppercase tracking-wider">No patterns</p>
        <p className="font-mono text-[10px] text-[var(--text-dim)]/50 mt-1">Generate one above</p>
      </div>
    );
  }

  const typeIcons: Record<string, string> = {
    wave: 'M2 12c0-3 2.5-6 4-6s4 3 4 6 2.5 6 4 6 4-3 4-6',
    firework: 'M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-7.07l-2.83 2.83M9.76 14.24l-2.83 2.83m0-10.14l2.83 2.83m4.48 4.48l2.83 2.83',
    rain: 'M12 2v6m0 4v6m-4-12v4m0 4v4m8-12v4m0 4v4',
    pulse: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-6a4 4 0 100-8 4 4 0 000 8z',
    blob: 'M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z',
    audioSpectrum: 'M3 18v-6m4 6V9m4 9V6m4 12v-9m4 9v-3',
    verticalWave: 'M3 12h4l3-9 4 18 3-9h4',
    starfield: 'M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6.4-4.8-6.4 4.8 2.4-7.2-6-4.8h7.6z',
    tetris: 'M4 4h4v4H4V4zm0 8h4v4H4v-4zm8-8h4v4h-4V4zm4 4h4v4h-4V8z',
    saturn: 'M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M2 12c0 2 4 3 10 3s10-1 10-3-4-3-10-3-10 1-10 3',
    custom: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  };

  const typeColors: Record<string, string> = {
    wave: 'var(--accent-cool)',
    firework: 'var(--accent-hot)',
    rain: 'var(--accent-cool)',
    pulse: 'var(--accent-hot)',
    blob: 'var(--accent-electric)',
    audioSpectrum: 'var(--accent-electric)',
    verticalWave: 'var(--accent-cool)',
    starfield: 'var(--accent-warm)',
    tetris: 'var(--accent-hot)',
    saturn: 'var(--accent-warm)',
    custom: 'var(--accent-warm)',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-[var(--text-dim)] uppercase tracking-wider">
          {patterns.filter(p => p.enabled).length} Active
        </span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {patterns.map((pattern, index) => (
          <div
            key={pattern.id}
            onClick={() => setActivePattern(pattern.id)}
            className={`pattern-chip p-3 rounded-lg cursor-pointer animate-fade-in ${
              activePatternId === pattern.id ? 'active' : ''
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePattern(pattern.id);
                  }}
                  className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                    pattern.enabled
                      ? 'bg-[var(--accent-electric)]'
                      : 'bg-[var(--bg-void)] border border-[var(--border-subtle)]'
                  }`}
                >
                  {pattern.enabled && (
                    <svg className="w-3 h-3 text-[var(--bg-void)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Icon */}
                <div
                  className="w-6 h-6 rounded flex items-center justify-center"
                  style={{ backgroundColor: `${typeColors[pattern.type] || typeColors.custom}20` }}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke={pattern.enabled ? (typeColors[pattern.type] || typeColors.custom) : 'var(--text-dim)'}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={typeIcons[pattern.type] || typeIcons.custom}
                    />
                  </svg>
                </div>

                {/* Name */}
                <span className={`text-sm ${pattern.enabled ? 'text-[var(--text-bright)]' : 'text-[var(--text-dim)]'}`}>
                  {pattern.name}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {/* Audio Reactive Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAudioReactive(pattern.id);
                  }}
                  className={`p-1.5 transition-colors ${
                    pattern.audioReactive
                      ? 'text-[var(--accent-electric)]'
                      : 'text-[var(--text-dim)] hover:text-[var(--text-mid)]'
                  }`}
                  title={pattern.audioReactive ? 'Audio reactive: ON' : 'Audio reactive: OFF'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </button>

                {/* Delete */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePattern(pattern.id);
                  }}
                  className="p-1.5 text-[var(--text-dim)] hover:text-[var(--accent-hot)] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Description and Stats */}
            <div className="mt-2 pl-8 space-y-1">
              <p className="font-mono text-[10px] text-[var(--text-dim)]">
                {PATTERN_INFO[pattern.type]?.description || pattern.type}
              </p>
              <div className="flex items-center gap-3">
                <span
                  className="font-mono text-[9px] px-2 py-0.5 rounded uppercase tracking-wider"
                  style={{
                    backgroundColor: `${typeColors[pattern.type] || typeColors.custom}15`,
                    color: typeColors[pattern.type] || typeColors.custom
                  }}
                >
                  {PATTERN_INFO[pattern.type]?.name || pattern.type}
                </span>
                <span className="font-mono text-[9px] text-[var(--text-dim)]">
                  SPD {pattern.parameters.speed.toFixed(1)} &middot; INT {(pattern.parameters.intensity * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
