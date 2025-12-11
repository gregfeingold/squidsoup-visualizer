import { useRef, useState, useEffect } from 'react';
import { TimelineClip as ClipType, useTimelineStore } from '../../stores/timelineStore';
import { PatternType } from '../../patterns/types';

interface TimelineClipProps {
  clip: ClipType;
  pixelsPerSecond: number;
  onSelect: () => void;
  isSelected: boolean;
}

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

export function TimelineClip({ clip, pixelsPerSecond, onSelect, isSelected }: TimelineClipProps) {
  const clipRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, startTime: 0, duration: 0 });

  const { moveClip, resizeClip, removeClip, updateClipAudioReactive } = useTimelineStore();

  const LABEL_WIDTH = 64; // Match the track label width
  const left = clip.startTime * pixelsPerSecond + LABEL_WIDTH;
  const width = clip.duration * pixelsPerSecond;
  const color = PATTERN_COLORS[clip.patternType] || '#888';

  // Handle mouse move for dragging/resizing
  useEffect(() => {
    if (!isDragging && !isResizingLeft && !isResizingRight) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaTime = deltaX / pixelsPerSecond;

      if (isDragging) {
        // Clamp to >= 0 so clips can't go before timeline start
        const newStartTime = Math.max(0, dragStart.startTime + deltaTime);
        moveClip(clip.id, newStartTime, clip.track);
      } else if (isResizingRight) {
        resizeClip(clip.id, dragStart.duration + deltaTime);
      } else if (isResizingLeft) {
        const newDuration = dragStart.duration - deltaTime;
        // Also prevent resizing from left to push clip before time 0
        const wouldStartAt = dragStart.startTime + (dragStart.duration - newDuration);
        if (newDuration >= 1 && wouldStartAt >= 0) {
          resizeClip(clip.id, newDuration, true);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizingLeft, isResizingRight, dragStart, pixelsPerSecond, clip.id, clip.track, moveClip, resizeClip]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setDragStart({ x: e.clientX, startTime: clip.startTime, duration: clip.duration });
    setIsDragging(true);
  };

  const handleResizeLeftDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setDragStart({ x: e.clientX, startTime: clip.startTime, duration: clip.duration });
    setIsResizingLeft(true);
  };

  const handleResizeRightDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setDragStart({ x: e.clientX, startTime: clip.startTime, duration: clip.duration });
    setIsResizingRight(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeClip(clip.id);
  };

  const handleToggleAudioReactive = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateClipAudioReactive(clip.id, !clip.patternConfig.audioReactive);
  };

  return (
    <div
      ref={clipRef}
      className={`absolute h-10 rounded cursor-move select-none transition-shadow ${
        isSelected ? 'ring-2 ring-white shadow-lg z-10' : 'hover:brightness-110'
      }`}
      style={{
        left: `${left}px`,
        width: `${Math.max(width, 20)}px`,
        backgroundColor: color,
        top: '4px',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-l"
        onMouseDown={handleResizeLeftDown}
      />

      {/* Clip content */}
      <div className="px-2 py-1 overflow-hidden whitespace-nowrap text-ellipsis flex items-center justify-between gap-1">
        <span className="text-xs font-mono text-white/90 drop-shadow truncate">
          {clip.patternConfig.name}
        </span>
        {/* Audio reactive toggle with music note icon - right side */}
        <button
          className={`flex items-center gap-0.5 px-1 py-0.5 rounded shrink-0 transition-colors ${
            clip.patternConfig.audioReactive
              ? 'bg-white/20'
              : 'bg-black/20 opacity-50'
          }`}
          onClick={handleToggleAudioReactive}
          title={clip.patternConfig.audioReactive ? 'Audio reactive (click to disable)' : 'Not audio reactive (click to enable)'}
        >
          {/* Music note icon */}
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
          {/* Checkbox */}
          <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${
            clip.patternConfig.audioReactive
              ? 'bg-white/30 border-white/60'
              : 'border-white/40'
          }`}>
            {clip.patternConfig.audioReactive && (
              <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </button>
      </div>

      {/* Delete button - only show when selected */}
      {isSelected && (
        <button
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center text-white text-xs z-20"
          onClick={handleDelete}
        >
          ×
        </button>
      )}

      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 rounded-r"
        onMouseDown={handleResizeRightDown}
      />

      {/* Duration indicator */}
      <div className="absolute bottom-0 right-1 text-[9px] font-mono text-white/60">
        {clip.duration.toFixed(1)}s
      </div>
    </div>
  );
}
