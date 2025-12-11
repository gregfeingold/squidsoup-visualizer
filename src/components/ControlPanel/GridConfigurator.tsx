import { usePatternStore } from '../../stores/patternStore';

export function GridConfigurator() {
  const { gridConfig, setGridConfig } = usePatternStore();

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
              type="number"
              min={5}
              max={50}
              value={gridConfig.dimensions.width}
              onChange={(e) => setGridConfig({
                dimensions: { ...gridConfig.dimensions, width: parseInt(e.target.value) || 20 }
              })}
              className="w-full px-2 py-1.5 bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded font-mono text-xs text-center text-[var(--text-mid)] focus:border-[var(--accent-electric)] focus:outline-none"
            />
          </div>
          <div>
            <label className="font-mono text-[9px] text-[var(--text-dim)]/50 block mb-1">H</label>
            <input
              type="number"
              min={5}
              max={30}
              value={gridConfig.dimensions.height}
              onChange={(e) => setGridConfig({
                dimensions: { ...gridConfig.dimensions, height: parseInt(e.target.value) || 10 }
              })}
              className="w-full px-2 py-1.5 bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded font-mono text-xs text-center text-[var(--text-mid)] focus:border-[var(--accent-electric)] focus:outline-none"
            />
          </div>
          {gridConfig.mode === '3d' && (
            <div>
              <label className="font-mono text-[9px] text-[var(--text-dim)]/50 block mb-1">D</label>
              <input
                type="number"
                min={5}
                max={50}
                value={gridConfig.dimensions.depth}
                onChange={(e) => setGridConfig({
                  dimensions: { ...gridConfig.dimensions, depth: parseInt(e.target.value) || 20 }
                })}
                className="w-full px-2 py-1.5 bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded font-mono text-xs text-center text-[var(--text-mid)] focus:border-[var(--accent-electric)] focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
