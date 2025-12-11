import { useRef, useEffect, useCallback, useState } from 'react';
import { useAudioStore } from '../../stores/audioStore';
import { audioAnalyzer } from '../../services/audioAnalyzer';

export function AudioUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  const {
    audioFile,
    audioUrl,
    isPlaying,
    currentTime,
    duration,
    analysis,
    setAudioFile,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setAnalysis,
  } = useAudioStore();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    audio.src = audioUrl;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    audioAnalyzer.initialize(audio);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl, setDuration, setIsPlaying]);

  const updateAnalysis = useCallback(() => {
    const audio = audioRef.current;
    if (audio && isPlaying) {
      setCurrentTime(audio.currentTime);
      const analysisData = audioAnalyzer.analyze();
      setAnalysis(analysisData);
    }
    animationRef.current = requestAnimationFrame(updateAnalysis);
  }, [isPlaying, setCurrentTime, setAnalysis]);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateAnalysis);
    }
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, updateAnalysis]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audioAnalyzer.resume();
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />

      {/* File upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {!audioFile ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full py-8 border border-dashed rounded-lg transition-all cursor-pointer ${
            isDragging
              ? 'border-[var(--accent-electric)] bg-[var(--accent-electric)]/10 scale-[1.02]'
              : 'border-[var(--border-subtle)] hover:border-[var(--accent-warm)]'
          }`}
        >
          <div className={`flex flex-col items-center gap-3 transition-colors ${
            isDragging ? 'text-[var(--accent-electric)]' : 'text-[var(--text-dim)]'
          }`}>
            <svg className={`w-10 h-10 transition-transform ${isDragging ? 'scale-110' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <span className="font-mono text-xs uppercase tracking-wider">
              {isDragging ? 'Drop to upload' : 'Drop audio file or click'}
            </span>
            <span className="font-mono text-[10px] text-[var(--text-dim)]/50">MP3, WAV, OGG</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* File info */}
          <div className="flex items-center justify-between p-3 bg-[var(--bg-void)] rounded-lg border border-[var(--border-subtle)]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-warm)]/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[var(--accent-warm)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <span className="font-mono text-xs text-[var(--text-mid)] truncate">{audioFile.name}</span>
            </div>
            <button
              onClick={() => setAudioFile(null)}
              className="p-1.5 text-[var(--text-dim)] hover:text-[var(--accent-hot)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Play controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlayPause}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isPlaying
                  ? 'bg-[var(--accent-warm)] glow-hot'
                  : 'bg-[var(--bg-elevated)] hover:bg-[var(--accent-warm)] border border-[var(--border-subtle)]'
              }`}
            >
              {isPlaying ? (
                <svg className="w-4 h-4 text-[var(--bg-void)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full"
              />
            </div>

            <span className="font-mono text-[10px] text-[var(--text-dim)] tabular-nums whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Audio levels */}
          {isPlaying && (
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <div className="h-16 bg-[var(--bg-void)] rounded-lg relative overflow-hidden border border-[var(--border-subtle)]">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[var(--accent-hot)] to-[var(--accent-hot)]/50 transition-all duration-75"
                    style={{ height: `${analysis.bass * 100}%` }}
                  />
                </div>
                <span className="font-mono text-[9px] text-[var(--text-dim)] uppercase tracking-wider">Bass</span>
              </div>
              <div className="text-center">
                <div className="h-16 bg-[var(--bg-void)] rounded-lg relative overflow-hidden border border-[var(--border-subtle)]">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[var(--accent-warm)] to-[var(--accent-warm)]/50 transition-all duration-75"
                    style={{ height: `${analysis.mid * 100}%` }}
                  />
                </div>
                <span className="font-mono text-[9px] text-[var(--text-dim)] uppercase tracking-wider">Mid</span>
              </div>
              <div className="text-center">
                <div className="h-16 bg-[var(--bg-void)] rounded-lg relative overflow-hidden border border-[var(--border-subtle)]">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[var(--accent-cool)] to-[var(--accent-cool)]/50 transition-all duration-75"
                    style={{ height: `${analysis.treble * 100}%` }}
                  />
                </div>
                <span className="font-mono text-[9px] text-[var(--text-dim)] uppercase tracking-wider">High</span>
              </div>
              <div className="text-center">
                <div className={`h-16 bg-[var(--bg-void)] rounded-lg flex flex-col items-center justify-center border transition-all ${
                  analysis.beat ? 'border-[var(--accent-electric)] glow-electric' : 'border-[var(--border-subtle)]'
                }`}>
                  <span className={`font-display text-2xl ${analysis.beat ? 'text-[var(--accent-electric)]' : 'text-[var(--text-dim)]'}`}>
                    {analysis.bpm || '--'}
                  </span>
                </div>
                <span className="font-mono text-[9px] text-[var(--text-dim)] uppercase tracking-wider">BPM</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
