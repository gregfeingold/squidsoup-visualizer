import { useState } from 'react';
import { usePatternStore } from '../../stores/patternStore';

export function ColorSchemeSelector() {
  const { colorSchemes, activeColorSchemeId, setActiveColorScheme, customColors, setCustomColors } = usePatternStore();
  const [showCustom, setShowCustom] = useState(false);
  const [editingColors, setEditingColors] = useState<string[]>(customColors.length > 0 ? customColors : ['#ff00ff', '#00ffff', '#ff0080']);

  const handleSchemeSelect = (id: string) => {
    setActiveColorScheme(id);
    setCustomColors([]);
    setShowCustom(false);
  };

  const handleCustomColorChange = (index: number, color: string) => {
    const newColors = [...editingColors];
    newColors[index] = color;
    setEditingColors(newColors);
  };

  const handleAddColor = () => {
    if (editingColors.length < 6) {
      setEditingColors([...editingColors, '#ffffff']);
    }
  };

  const handleRemoveColor = (index: number) => {
    if (editingColors.length > 2) {
      const newColors = editingColors.filter((_, i) => i !== index);
      setEditingColors(newColors);
    }
  };

  const handleApplyCustom = () => {
    setCustomColors(editingColors);
  };

  return (
    <div className="space-y-4">
      {/* Preset palettes */}
      <div className="grid grid-cols-2 gap-2">
        {colorSchemes.map((scheme) => (
          <button
            key={scheme.id}
            onClick={() => handleSchemeSelect(scheme.id)}
            className={`p-3 rounded-lg border transition-all ${
              activeColorSchemeId === scheme.id && customColors.length === 0
                ? 'border-[var(--accent-electric)] bg-[var(--bg-void)]'
                : 'border-[var(--border-subtle)] hover:border-[var(--text-dim)] bg-[var(--bg-void)]'
            }`}
          >
            <div className="flex gap-1.5 mb-2">
              {scheme.colors.slice(0, 5).map((color, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full ring-1 ring-white/10"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="font-mono text-[10px] text-[var(--text-dim)] uppercase tracking-wider">{scheme.name}</span>
          </button>
        ))}
      </div>

      {/* Custom colors toggle */}
      <button
        onClick={() => setShowCustom(!showCustom)}
        className={`w-full py-3 px-4 rounded-lg border text-left transition-all ${
          customColors.length > 0
            ? 'border-[var(--accent-electric)] bg-[var(--bg-void)]'
            : 'border-[var(--border-subtle)] hover:border-[var(--text-dim)] bg-[var(--bg-void)]'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-mid)]">Custom Palette</span>
          <svg
            className={`w-4 h-4 text-[var(--text-dim)] transition-transform ${showCustom ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {customColors.length > 0 && (
          <div className="flex gap-1.5 mt-2">
            {customColors.map((color, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full ring-1 ring-white/10"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </button>

      {/* Custom color editor */}
      {showCustom && (
        <div className="p-4 bg-[var(--bg-void)] rounded-lg border border-[var(--border-subtle)] space-y-3">
          <div className="space-y-2">
            {editingColors.map((color, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleCustomColorChange(index, e.target.value)}
                  className="w-10 h-8 rounded cursor-pointer bg-transparent border border-[var(--border-subtle)]"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => handleCustomColorChange(index, e.target.value)}
                  className="flex-1 px-2 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded text-xs font-mono text-[var(--text-mid)]"
                />
                {editingColors.length > 2 && (
                  <button
                    onClick={() => handleRemoveColor(index)}
                    className="p-1.5 text-[var(--text-dim)] hover:text-[var(--accent-hot)] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            {editingColors.length < 6 && (
              <button
                onClick={handleAddColor}
                className="flex-1 py-2 text-xs font-mono uppercase tracking-wider text-[var(--text-dim)] hover:text-[var(--text-bright)] border border-dashed border-[var(--border-subtle)] hover:border-[var(--text-dim)] rounded transition-colors"
              >
                + Add
              </button>
            )}
            <button
              onClick={handleApplyCustom}
              className="flex-1 py-2 text-xs font-display uppercase tracking-wider btn-primary rounded"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
