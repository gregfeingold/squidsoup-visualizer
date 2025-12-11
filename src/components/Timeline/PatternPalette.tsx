import { PatternType } from '../../patterns/types';
import { PATTERN_INFO } from '../../services/claude';
import { usePatternStore } from '../../stores/patternStore';

interface PatternPaletteProps {
  onDragStart: (patternType: PatternType) => void;
}

const PATTERN_TYPES: PatternType[] = [
  'wave',
  'firework',
  'rain',
  'pulse',
  'blob',
  'audioSpectrum',
  'starfield',
  'tetris',
  'saturn',
];

const PATTERN_COLORS: Record<PatternType, string> = {
  wave: '#00bfff',
  firework: '#ff4444',
  rain: '#00ddff',
  pulse: '#ff00aa',
  blob: '#aa00ff',
  custom: '#ffaa00',
  audioSpectrum: '#00ff88',
  verticalWave: '#44aaff',
  starfield: '#ffdd00',
  tetris: '#ff6600',
  saturn: '#ffaa44',
};

export function PatternPalette({ onDragStart }: PatternPaletteProps) {
  // Get generated patterns from the pattern store
  const patterns = usePatternStore((s) => s.patterns);

  const handleDragStart = (e: React.DragEvent, patternType: PatternType) => {
    e.dataTransfer.setData('patternType', patternType);
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart(patternType);
  };

  return (
    <div className="flex gap-2 py-2 px-3 overflow-x-auto border-b border-[var(--border-subtle)]/30">
      <span className="text-[10px] font-mono text-[var(--text-dim)] uppercase tracking-wider self-center mr-2 whitespace-nowrap">
        Drag to add:
      </span>

      {/* Show generated patterns first if any */}
      {patterns.length > 0 && (
        <>
          {patterns.map((pattern) => (
            <div
              key={pattern.id}
              draggable
              onDragStart={(e) => handleDragStart(e, pattern.type)}
              className="flex items-center gap-1.5 px-2 py-1 rounded cursor-grab active:cursor-grabbing hover:brightness-110 transition-all shrink-0 ring-1 ring-[var(--accent-electric)]/50"
              style={{
                backgroundColor: `${PATTERN_COLORS[pattern.type] || '#ffaa00'}33`,
                borderLeft: `3px solid ${PATTERN_COLORS[pattern.type] || '#ffaa00'}`
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: PATTERN_COLORS[pattern.type] || '#ffaa00' }}
              />
              <span className="text-xs font-mono text-[var(--text-bright)]">
                {pattern.name}
              </span>
              <span className="text-[9px] font-mono text-[var(--accent-electric)] ml-1">NEW</span>
            </div>
          ))}
          <div className="w-px h-6 bg-[var(--border-subtle)] self-center mx-1" />
        </>
      )}

      {/* Default pattern types */}
      {PATTERN_TYPES.map((type) => (
        <div
          key={type}
          draggable
          onDragStart={(e) => handleDragStart(e, type)}
          className="flex items-center gap-1.5 px-2 py-1 rounded cursor-grab active:cursor-grabbing hover:brightness-110 transition-all shrink-0"
          style={{ backgroundColor: `${PATTERN_COLORS[type]}33`, borderLeft: `3px solid ${PATTERN_COLORS[type]}` }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: PATTERN_COLORS[type] }}
          />
          <span className="text-xs font-mono text-[var(--text-bright)]">
            {PATTERN_INFO[type]?.name || type}
          </span>
        </div>
      ))}
    </div>
  );
}
