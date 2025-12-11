import { useRef, useState, useCallback, useEffect } from 'react';
import { useTimelineStore } from '../../stores/timelineStore';
import { useAudioStore } from '../../stores/audioStore';
import { PatternType } from '../../patterns/types';
import { TimelineClip } from './TimelineClip';
import { PatternPalette } from './PatternPalette';
import { audioAnalyzer } from '../../services/audioAnalyzer';

const TRACK_HEIGHT = 48;
const RULER_HEIGHT = 24;

export function TimelineEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tracksRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isDraggingPattern, setIsDraggingPattern] = useState(false);
  const [isDraggingAudio, setIsDraggingAudio] = useState(false);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);

  const {
    clips,
    isTimelineMode,
    showAlwaysOnPatterns,
    selectedClipId,
    zoom,
    scrollLeft,
    addClip,
    selectClip,
    removeClip,
    setTimelineMode,
    setShowAlwaysOnPatterns,
    setZoom,
    setScrollLeft,
    clearTimeline,
  } = useTimelineStore();

  const {
    audioFile,
    audioUrl,
    duration: audioDuration,
    currentTime,
    isPlaying,
    setAudioFile,
    setAudioElement,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setAnalysis,
    detectBeat,
  } = useAudioStore();

  // Calculate timeline width based on audio duration
  const timelineDuration = Math.max(audioDuration || 60, 60);
  const timelineWidth = timelineDuration * zoom;

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate time markers
  const generateMarkers = () => {
    const markers = [];
    const interval = zoom >= 100 ? 5 : zoom >= 50 ? 10 : 30;

    for (let t = 0; t <= timelineDuration; t += interval) {
      markers.push(
        <div
          key={t}
          className="absolute top-0 h-full border-l border-[var(--border-subtle)]/30"
          style={{ left: `${t * zoom}px` }}
        >
          <span className="absolute top-1 left-1 text-[10px] font-mono text-[var(--text-dim)]">
            {formatTime(t)}
          </span>
        </div>
      );
    }
    return markers;
  };

  // Audio file handling
  const handleAudioFile = useCallback(async (file: File) => {
    setAudioFile(file);
  }, [setAudioFile]);

  // Setup audio when URL changes
  useEffect(() => {
    if (!audioUrl || !audioRef.current) return;

    const audio = audioRef.current;
    setAudioElement(audio);

    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);

    // Initialize audio analyzer
    const initAnalyzer = async () => {
      await audioAnalyzer.initialize(audio);

      // Start analysis loop
      const analyzeLoop = () => {
        if (!audio.paused) {
          const analysis = audioAnalyzer.analyze();
          setAnalysis(analysis);
          if (analysis.amplitude > 0) {
            detectBeat(analysis.amplitude);
          }
        }
        requestAnimationFrame(analyzeLoop);
      };
      analyzeLoop();
    };

    initAnalyzer();
  }, [audioUrl, setAudioElement, setDuration, setCurrentTime, setIsPlaying, setAnalysis, detectBeat]);

  // Handle audio drop
  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAudio(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('audio/')) {
      handleAudioFile(file);
    }
  };

  const handleAudioDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingAudio(true);
    }
  };

  // Handle pattern drop on animation track
  const handlePatternDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPattern(false);

    const patternType = e.dataTransfer.getData('patternType') as PatternType;
    if (!patternType || !tracksRef.current) return;

    const rect = tracksRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollLeft;
    const startTime = Math.max(0, x / zoom);

    addClip(patternType, startTime, 0); // Always track 0 for animations
  };

  const handlePatternDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('patternType') || e.dataTransfer.getData('patternType')) {
      setIsDraggingPattern(true);
    }
  };

  // Handle playhead click to seek
  const handleRulerClick = (e: React.MouseEvent) => {
    if (!tracksRef.current || !audioRef.current) return;

    const rect = tracksRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollLeft;
    const time = Math.max(0, Math.min(audioDuration || 0, x / zoom));

    audioRef.current.currentTime = time;
  };

  // Handle playhead drag
  const handlePlayheadMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingPlayhead(true);
  };

  useEffect(() => {
    if (!isDraggingPlayhead) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!tracksRef.current || !audioRef.current) return;

      const rect = tracksRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollLeft;
      const time = Math.max(0, Math.min(audioDuration || 0, x / zoom));

      audioRef.current.currentTime = time;
    };

    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPlayhead, scrollLeft, audioDuration, zoom]);

  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  // Playhead position
  const playheadLeft = currentTime * zoom;

  // Play/Pause
  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(zoom + 20);
  const handleZoomOut = () => setZoom(zoom - 20);

  // Rewind to start
  const handleRewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  // Delete selected clip with Delete/Backspace key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClipId) {
        // Don't delete if user is typing in an input field
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        e.preventDefault();
        removeClip(selectedClipId);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, removeClip]);

  // File input for audio
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAudioFile(file);
    }
  };

  return (
    <div className="bg-[var(--bg-void)] border-t border-[var(--border-subtle)] flex flex-col">
      {/* Hidden audio element */}
      {audioUrl && <audio ref={audioRef} src={audioUrl} />}

      {/* Controls bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-deep)]">
        <div className="flex items-center gap-3">
          {/* Rewind */}
          <button
            onClick={handleRewind}
            disabled={!audioFile}
            className="w-8 h-8 flex items-center justify-center rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] disabled:opacity-50 disabled:cursor-not-allowed"
            title="Rewind to start"
          >
            <svg className="w-4 h-4 text-[var(--text-mid)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlayback}
            disabled={!audioFile}
            className="w-8 h-8 flex items-center justify-center rounded bg-[var(--accent-electric)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlaying ? (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Current time */}
          <span className="font-mono text-sm text-[var(--text-bright)] min-w-[100px]">
            {formatTime(currentTime)} / {formatTime(audioDuration || 0)}
          </span>

          {/* Timeline mode toggle */}
          <button
            onClick={() => setTimelineMode(!isTimelineMode)}
            className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
              isTimelineMode
                ? 'bg-[var(--accent-electric)] text-white'
                : 'bg-[var(--bg-surface)] text-[var(--text-dim)] hover:text-[var(--text-mid)]'
            }`}
          >
            Timeline {isTimelineMode ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Clear button */}
          <button
            onClick={clearTimeline}
            className="px-2 py-1 rounded text-xs font-mono text-[var(--text-dim)] hover:text-[var(--accent-hot)] hover:bg-[var(--bg-surface)] transition-colors"
          >
            Clear
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-[var(--bg-surface)] rounded px-2 py-1">
            <button onClick={handleZoomOut} className="text-[var(--text-dim)] hover:text-[var(--text-bright)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-xs font-mono text-[var(--text-mid)] w-12 text-center">{zoom}px/s</span>
            <button onClick={handleZoomIn} className="text-[var(--text-dim)] hover:text-[var(--text-bright)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Pattern palette - only show when timeline is ON */}
      {isTimelineMode && (
        <PatternPalette onDragStart={() => setIsDraggingPattern(false)} />
      )}

      {/* Timeline tracks area - only show when timeline is ON */}
      {isTimelineMode && (
      <div
        ref={containerRef}
        className="overflow-x-auto overflow-y-hidden relative"
        onScroll={handleScroll}
        style={{ height: `${RULER_HEIGHT + 2 * TRACK_HEIGHT + 8}px` }}
      >
        {/* Scrollable content */}
        <div style={{ width: `${timelineWidth}px`, minWidth: '100%' }}>
          {/* Time ruler */}
          <div
            className="relative bg-[var(--bg-deep)] border-b border-[var(--border-subtle)] cursor-pointer"
            style={{ height: `${RULER_HEIGHT}px` }}
            onClick={handleRulerClick}
          >
            {generateMarkers()}
          </div>

          {/* Track labels */}
          <div className="absolute left-0 top-0 z-10 pointer-events-none" style={{ marginTop: `${RULER_HEIGHT}px` }}>
            <div className="h-12 w-16 flex items-center px-2 bg-[var(--bg-void)] border-r border-[var(--border-subtle)]">
              <span className="text-[10px] font-mono text-[var(--accent-warm)] uppercase">Audio</span>
            </div>
            <div className="h-12 w-16 flex items-center px-2 bg-[var(--bg-void)] border-r border-[var(--border-subtle)]">
              <span className="text-[10px] font-mono text-[var(--accent-electric)] uppercase">Anim</span>
            </div>
          </div>

          {/* Tracks */}
          <div ref={tracksRef} className="relative" style={{ height: `${2 * TRACK_HEIGHT}px` }}>
            {/* Audio Track */}
            <div
              className={`absolute w-full border-b border-[var(--border-subtle)]/50 transition-colors ${
                isDraggingAudio ? 'bg-[var(--accent-warm)]/20' : ''
              }`}
              style={{ top: 0, height: `${TRACK_HEIGHT}px` }}
              onDrop={handleAudioDrop}
              onDragOver={handleAudioDragOver}
              onDragLeave={() => setIsDraggingAudio(false)}
            >
              {audioFile ? (
                /* Audio waveform placeholder - starts at 0:00, with left margin for label */
                <div className="absolute inset-0 flex items-center" style={{ left: '64px' }}>
                  <div
                    className="h-8 rounded bg-[var(--accent-warm)]/30 border border-[var(--accent-warm)]/50 flex items-center px-3"
                    style={{ width: `${(audioDuration || 0) * zoom}px` }}
                  >
                    <svg className="w-4 h-4 text-[var(--accent-warm)] mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <span className="text-xs font-mono text-[var(--accent-warm)] truncate">
                      {audioFile.name}
                    </span>
                  </div>
                </div>
              ) : (
                /* Drop zone for audio */
                <label className="absolute inset-0 mx-12 flex items-center justify-center cursor-pointer group">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <div className={`flex items-center gap-2 px-4 py-2 rounded border-2 border-dashed transition-colors ${
                    isDraggingAudio
                      ? 'border-[var(--accent-warm)] bg-[var(--accent-warm)]/10'
                      : 'border-[var(--border-subtle)] group-hover:border-[var(--accent-warm)]/50'
                  }`}>
                    <svg className="w-5 h-5 text-[var(--text-dim)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <span className="text-xs font-mono text-[var(--text-dim)]">
                      Drop audio file or click to browse
                    </span>
                  </div>
                </label>
              )}
            </div>

            {/* Animation Track */}
            <div
              className={`absolute w-full border-b border-[var(--border-subtle)]/50 transition-colors ${
                isDraggingPattern ? 'bg-[var(--accent-electric)]/10' : ''
              }`}
              style={{ top: `${TRACK_HEIGHT}px`, height: `${TRACK_HEIGHT}px` }}
              onDrop={handlePatternDrop}
              onDragOver={handlePatternDragOver}
              onDragLeave={() => setIsDraggingPattern(false)}
              onClick={() => selectClip(null)}
            >
              {clips.length === 0 && !isDraggingPattern && (
                <div className="absolute inset-0 mx-12 flex items-center justify-center pointer-events-none">
                  <span className="text-xs font-mono text-[var(--text-dim)]/50">
                    Drag patterns here to create animation clips
                  </span>
                </div>
              )}

              {/* Clips */}
              {clips.map((clip) => (
                <TimelineClip
                  key={clip.id}
                  clip={clip}
                  pixelsPerSecond={zoom}
                  onSelect={() => selectClip(clip.id)}
                  isSelected={selectedClipId === clip.id}
                />
              ))}
            </div>

            {/* Playhead - draggable */}
            <div
              className={`absolute top-0 bottom-0 w-0.5 bg-[var(--accent-hot)] z-20 ${isDraggingPlayhead ? 'cursor-grabbing' : ''}`}
              style={{ left: `${playheadLeft}px` }}
            >
              <div
                className={`absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-[var(--accent-hot)] rotate-45 cursor-grab hover:scale-110 transition-transform ${isDraggingPlayhead ? 'cursor-grabbing scale-125' : ''}`}
                onMouseDown={handlePlayheadMouseDown}
                style={{ pointerEvents: 'auto' }}
              />
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
