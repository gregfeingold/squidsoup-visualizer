import { useState } from 'react';
import * as THREE from 'three';
import { usePatternStore } from '../../stores/patternStore';
import { generatePatternFromDescription, DEMO_PATTERNS, PATTERN_INFO } from '../../services/claude';

export function PatternInput() {
  const [description, setDescription] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [error, setError] = useState('');
  const { isGenerating, setIsGenerating, addPatternFromGeneration } = usePatternStore();

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please enter a pattern description');
      return;
    }

    setError('');
    setIsGenerating(true);

    try {
      // Check for demo patterns first
      const lowerDesc = description.toLowerCase();
      const demoKey = Object.keys(DEMO_PATTERNS).find(key =>
        lowerDesc.includes(key) || key.includes(lowerDesc.split(' ')[0])
      );

      let pattern;

      if (!apiKey && demoKey) {
        // Use demo pattern
        pattern = DEMO_PATTERNS[demoKey];
      } else if (apiKey) {
        // Use Claude API
        pattern = await generatePatternFromDescription(description, apiKey);
      } else {
        // No API key and no matching demo
        setError('Enter an API key or try: "expanding sphere", "starfield", "falling streaks", "beat shells", "drifting orbs", "saturn", "tetris"');
        setIsGenerating(false);
        return;
      }

      // Convert direction/origin arrays to Vector3
      const params = {
        ...pattern.parameters,
        direction: pattern.parameters.direction
          ? new THREE.Vector3(...pattern.parameters.direction)
          : new THREE.Vector3(0, 1, 0),
        origin: pattern.parameters.origin
          ? new THREE.Vector3(...pattern.parameters.origin)
          : new THREE.Vector3(0, 0, 0),
      };

      addPatternFromGeneration(pattern.type, pattern.name, params);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate pattern');
    } finally {
      setIsGenerating(false);
    }
  };

  // Quick patterns with display name and key for DEMO_PATTERNS lookup
  const quickPatterns = [
    { key: 'expanding sphere', label: 'Expanding Sphere' },
    { key: 'starfield', label: 'Starfield' },
    { key: 'saturn', label: 'Saturn' },
    { key: 'tetris', label: 'Tetris' },
    { key: 'falling streaks', label: 'Falling Streaks' },
    { key: 'rising tide', label: 'Rising Tide' },
    { key: 'drifting orbs', label: 'Drifting Orbs' },
    { key: 'beat shells', label: 'Beat Shells' },
    { key: 'burst particles', label: 'Burst Particles' },
  ];

  return (
    <div className="space-y-4">
      {/* Description input */}
      <div>
        <label className="block font-mono text-xs text-[var(--text-dim)] uppercase tracking-wider mb-2">
          Describe Pattern
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder='e.g., "Waves rippling outward, pulsing with bass"'
          className="w-full h-20 px-3 py-2.5 bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-bright)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent-electric)] transition-colors resize-none font-mono text-sm"
        />
      </div>

      {/* Quick pattern buttons */}
      <div className="flex flex-wrap gap-2">
        {quickPatterns.map((p) => (
          <button
            key={p.key}
            onClick={() => setDescription(p.key)}
            className="px-3 py-1.5 text-xs font-mono uppercase tracking-wide bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded hover:border-[var(--accent-electric)] hover:text-[var(--accent-electric)] transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* API Key input */}
      <div>
        <label className="block font-mono text-xs text-[var(--text-dim)] uppercase tracking-wider mb-2">
          Claude API Key
          <span className="ml-2 text-[var(--text-dim)]/50">(optional)</span>
        </label>
        <div className="relative">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full px-3 py-2 pr-16 bg-[var(--bg-void)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-bright)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--accent-electric)] transition-colors font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--text-dim)] hover:text-[var(--text-bright)] transition-colors"
          >
            {showApiKey ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="px-3 py-2 bg-[var(--accent-hot)]/10 border border-[var(--accent-hot)]/30 rounded-lg">
          <p className="text-[var(--accent-hot)] text-xs font-mono">{error}</p>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full py-3 px-4 btn-primary rounded-lg font-display text-lg tracking-wider uppercase disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Generating...
          </span>
        ) : (
          'Generate Pattern'
        )}
      </button>
    </div>
  );
}
