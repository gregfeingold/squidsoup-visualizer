import { useState, useEffect } from 'react';
import { usePatternStore } from '../../stores/patternStore';

export function GridConfigurator() {
  const { gridConfig, setGridConfig } = usePatternStore();

  // Local state for dimension inputs to allow clearing
  const [localDims, setLocalDims] = useState({
    width: String(gridConfig.dimensions.width),
    height: String(gridConfig.dimensions.height),
    depth: String(gridConfig.dimensions.depth),
  });

  // Sync local state when store changes externally
  useEffect(() => {
    setLocalDims({
      width: String(gridConfig.dimensions.width),
      height: String(gridConfig.dimensions.height),
      depth: String(gridConfig.dimensions.depth),
    });
  }, [gridConfig.dimensions.width, gridConfig.dimensions.height, gridConfig.dimensions.depth]);

  const handleDimensionChange = (dim: 'width' | 'height' | 'depth', value: string) => {
    setLocalDims(prev => ({ ...prev, [dim]: value }));
  };

  const handleDimensionBlur = (dim: 'width' | 'height' | 'depth') => {
    const value = parseInt(localDims[dim]);
    const defaults = { width: 20, height: 10, depth: 20 };
    const mins = { width: 5, height: 5, depth: 5 };
    const maxs = { width: 50, height: 30, depth: 50 };

    if (isNaN(value) || value < mins[dim]) {
      setLocalDims(prev => ({ ...prev, [dim]: String(defaults[dim]) }));
      setGridConfig({ dimensions: { ...gridConfig.dimensions, [dim]: defaults[dim] } });
    } else {
      const clamped = Math.min(value, maxs[dim]);
      setLocalDims(prev => ({ ...prev, [dim]: String(clamped) }));
      setGridConfig({ dimensions: { ...gridConfig.dimensions, [dim]: clamped } });
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setGridConfig({ mode: '3d' })}
          className={`flex-1 py-2.5 px-3 rounded-lg font-mono text-xs uppercase tracking-wider transition-all ${
            gridConfig.mode === '3d'
              ? 'bg-[var(--accent-electric)] text-[var(--bg-void)]'
              : 'bg-[var(--bg-void)] text-[var(--text-dim)] hover:text-[var(--text-bright)] border border-[var(--border-subtle)]'
          }`}
        >
          3D Volume
        </button>
        <button
          onClick={() => setGridConfig({ mode: '2d' })}
          className={`flex-1 py-2.5 px-3 rounded-lg font-mono text-xs uppercase tracking-wider transition-all ${
            gridConfig.mode === '2d'
              ? 'bg-[var(--accent-electric)] text-[var(--bg-void)]'
              : 'bg-[var(--bg-void)] text-[var(--text-dim)] hover:text-[var(--text-bright)] border border-[var(--border-subtle)]'
          }`}
        >
          2D Wall
        </button>
      </div>

      {/* Point count */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="font-mono text-xs text-[var(--text-dim)] uppercase tracking-wider">Points</span>
          <span className="font-mono text-xs text-[var(--accent-electric)]">{gridConfig.pointCount.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min={1000}
          max={50000}
          step={1000}
          value={gridConfig.pointCount}
          onChange={(e) => setGridConfig({ pointCount: parseInt(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between mt-1">
          <span className="font-mono text-[9px] text-[var(--text-dim)]/50">1K</span>
          <span className="font-mono text-[9px] text-[var(--text-dim)]/50">50K</span>
        </div>
      </div>

      {/* Distribution */}
      <div>
        <span className="font-mono text-xs text-[var(--text-dim)] uppercase tracking-wider block mb-2">Distribution</span>
        <div className="grid grid-cols-3 gap-2">
          {(['grid', 'random', 'organic'] as const).map((dist) => (
            <button
              key={dist}
              onClick={() => setGridConfig({ distribution: dist })}
              className={`py-2 px-2 rounded-lg font-mono text-[10px] uppercase tracking-wider transition-all ${
                gridConfig.distribution === dist
                  ? 'bg-[var(--accent-electric)] text-[var(--bg-void)]'
                  : 'bg-[var(--bg-void)] text-[var(--text-dim)] hover:text-[var(--text-bright)] border border-[var(--border-subtle)]'
              }`}
            >
              {dist}
            </button>
          ))}
        </div>
      </div>

      {/* Dimensions */}
      <div className="space-y-2">
        <span className="font-mono text-xs text-[var(--text-dim)] uppercase tracking-wider block">Dimensions</span>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="font-mono text-[9px] text-[var(--text-dim)]/50 block mb-1">W</label>
            <input
              type="text"
              inputMode="numeric"
              value={localDims.width}
              onChange={(e) => handleDimensionChange('width', e.target.value)}
              onBlur={() => handleDimensionBlur('width')}
              className="w-full px-2 py-1.5 bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded font-mono text-xs text-center text-[var(--text-mid)] focus:border-[var(--accent-electric)] focus:outline-none"
            />
          </div>
          <div>
            <label className="font-mono text-[9px] text-[var(--text-dim)]/50 block mb-1">H</label>
            <input
              type="text"
              inputMode="numeric"
              value={localDims.height}
              onChange={(e) => handleDimensionChange('height', e.target.value)}
              onBlur={() => handleDimensionBlur('height')}
              className="w-full px-2 py-1.5 bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded font-mono text-xs text-center text-[var(--text-mid)] focus:border-[var(--accent-electric)] focus:outline-none"
            />
          </div>
          {gridConfig.mode === '3d' && (
            <div>
              <label className="font-mono text-[9px] text-[var(--text-dim)]/50 block mb-1">D</label>
              <input
                type="text"
                inputMode="numeric"
                value={localDims.depth}
                onChange={(e) => handleDimensionChange('depth', e.target.value)}
                onBlur={() => handleDimensionBlur('depth')}
                className="w-full px-2 py-1.5 bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded font-mono text-xs text-center text-[var(--text-mid)] focus:border-[var(--accent-electric)] focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
