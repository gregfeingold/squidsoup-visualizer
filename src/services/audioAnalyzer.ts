import { AudioAnalysis } from '../patterns/types';

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private frequencyData: Uint8Array = new Uint8Array(0);
  private timeDomainData: Uint8Array = new Uint8Array(0);

  private lastBeatTime = 0;
  private beatThreshold = 0.65;
  private beatHoldTime = 150; // ms
  private previousAmplitude = 0;
  private bpmHistory: number[] = [];

  // Frequency band ranges (for 2048 FFT size at 44100Hz, each bin is ~21.5Hz)
  private readonly BASS_END = 10;      // ~215Hz
  private readonly MID_END = 50;       // ~1075Hz
  private readonly TREBLE_END = 200;   // ~4300Hz

  async initialize(audioElement: HTMLAudioElement): Promise<void> {
    // Create audio context
    this.audioContext = new AudioContext();

    // Create analyser node
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.8;

    // Create source from audio element
    this.sourceNode = this.audioContext.createMediaElementSource(audioElement);
    this.sourceNode.connect(this.analyserNode);
    this.analyserNode.connect(this.audioContext.destination);

    // Initialize data arrays
    this.frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.timeDomainData = new Uint8Array(this.analyserNode.fftSize);
  }

  analyze(): AudioAnalysis {
    if (!this.analyserNode) {
      return this.getEmptyAnalysis();
    }

    // Get frequency data
    this.analyserNode.getByteFrequencyData(this.frequencyData);
    this.analyserNode.getByteTimeDomainData(this.timeDomainData);

    // Calculate frequency bands
    const bass = this.getAverageFrequency(0, this.BASS_END);
    const mid = this.getAverageFrequency(this.BASS_END, this.MID_END);
    const treble = this.getAverageFrequency(this.MID_END, this.TREBLE_END);

    // Calculate overall amplitude from time domain
    const amplitude = this.getAmplitude();

    // Detect beats
    const beat = this.detectBeat(bass, amplitude);

    // Update BPM
    const bpm = this.calculateBPM();

    return {
      bass,
      mid,
      treble,
      amplitude,
      beat,
      bpm,
      frequencyData: this.frequencyData,
      timestamp: performance.now(),
    };
  }

  private getAverageFrequency(start: number, end: number): number {
    if (!this.frequencyData.length) return 0;

    let sum = 0;
    for (let i = start; i < end && i < this.frequencyData.length; i++) {
      sum += this.frequencyData[i];
    }
    return sum / (end - start) / 255; // Normalize to 0-1
  }

  private getAmplitude(): number {
    if (!this.timeDomainData.length) return 0;

    let max = 0;
    let min = 255;

    for (let i = 0; i < this.timeDomainData.length; i++) {
      if (this.timeDomainData[i] > max) max = this.timeDomainData[i];
      if (this.timeDomainData[i] < min) min = this.timeDomainData[i];
    }

    return (max - min) / 255; // Normalize to 0-1
  }

  private detectBeat(bass: number, amplitude: number): boolean {
    const now = performance.now();

    // Don't detect beats too close together
    if (now - this.lastBeatTime < this.beatHoldTime) {
      return false;
    }

    // Combine bass energy with amplitude spike detection
    const bassWeight = 0.7;
    const amplitudeWeight = 0.3;

    const combined = bass * bassWeight + amplitude * amplitudeWeight;
    const previous = this.previousAmplitude;
    this.previousAmplitude = combined;

    // Detect if we crossed the threshold with a significant jump
    const isBeat = combined > this.beatThreshold &&
                   combined > previous * 1.1 &&
                   bass > 0.4;

    if (isBeat) {
      this.recordBeat(now);
      this.lastBeatTime = now;
    }

    return isBeat;
  }

  private recordBeat(time: number): void {
    if (this.lastBeatTime > 0) {
      const interval = time - this.lastBeatTime;
      const instantBPM = 60000 / interval;

      // Only record reasonable BPM values
      if (instantBPM >= 60 && instantBPM <= 180) {
        this.bpmHistory.push(instantBPM);
        if (this.bpmHistory.length > 12) {
          this.bpmHistory.shift();
        }
      }
    }
  }

  private calculateBPM(): number {
    if (this.bpmHistory.length < 4) return 0;

    // Use median to filter outliers
    const sorted = [...this.bpmHistory].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

    return Math.round(median);
  }

  private getEmptyAnalysis(): AudioAnalysis {
    return {
      bass: 0,
      mid: 0,
      treble: 0,
      amplitude: 0,
      beat: false,
      bpm: 0,
      frequencyData: new Uint8Array(0),
      timestamp: 0,
    };
  }

  resume(): void {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  destroy(): void {
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
    if (this.analyserNode) {
      this.analyserNode.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.audioContext = null;
    this.analyserNode = null;
    this.sourceNode = null;
    this.bpmHistory = [];
  }
}

// Singleton instance for the app
export const audioAnalyzer = new AudioAnalyzer();
